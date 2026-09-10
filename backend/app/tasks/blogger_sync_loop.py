import asyncio
import logging
from datetime import UTC, datetime, timedelta

from app.core.config import get_settings
from app.core.db import get_db
from app.repositories.activity_log import ActivityLogRepository
from app.repositories.blogger_sync_runs import BloggerSyncRunsRepository
from app.repositories.content_repository import ContentRepository
from app.services.blogger_sync_service import BloggerSyncService

logger = logging.getLogger("app.blogger_sync_loop")

_LOCK_ID = "blogger_sync"
_LOCK_TTL_SECONDS = 300  # if a holder crashes mid-run, the lock self-expires


async def _try_acquire_lock() -> bool:
    """Mongo-based mutual-exclusion lock (architecture.md: "use a lock so
    one instance executes it in production"). A single upsert with a
    filter on "unlocked or expired" is atomic, so exactly one process wins
    even with multiple API replicas racing on the same interval tick."""
    db = get_db()
    now = datetime.now(UTC)
    result = await db["_locks"].update_one(
        {
            "_id": _LOCK_ID,
            "$or": [{"expiresAt": {"$lt": now}}, {"expiresAt": {"$exists": False}}],
        },
        {"$set": {"expiresAt": now + timedelta(seconds=_LOCK_TTL_SECONDS)}},
        upsert=True,
    )
    return result.upserted_id is not None or result.modified_count > 0


async def blogger_sync_loop(stop_event: asyncio.Event) -> None:
    """Runs for the lifetime of the app (started in lifespan). Sleeps for
    the configured interval, then attempts a sync if enabled — disabled by
    default (blogger_sync_enabled), so this is a no-op until an operator
    turns it on via site_settings/env."""
    while not stop_event.is_set():
        settings = get_settings()
        interval_seconds = max(settings.blogger_sync_interval_minutes, 1) * 60

        if settings.blogger_sync_enabled:
            try:
                if await _try_acquire_lock():
                    db = get_db()
                    service = BloggerSyncService(
                        ContentRepository(db, "blog_posts"),
                        ActivityLogRepository(db),
                        BloggerSyncRunsRepository(db),
                    )
                    result = await service.run_once()
                    logger.info("Blogger sync run finished: %s", result.get("status"))
            except Exception:  # noqa: BLE001 — the loop must survive a bad run
                logger.exception("Blogger sync loop iteration failed")

        try:
            await asyncio.wait_for(stop_event.wait(), timeout=interval_seconds)
        except TimeoutError:
            pass  # normal case: interval elapsed, loop again
