import asyncio
import re

import httpx

from app.core.config import get_settings
from app.core.content_registry import COLLECTIONS
from app.repositories.activity_log import ActivityLogRepository
from app.repositories.blogger_sync_runs import BloggerSyncRunsRepository
from app.repositories.content_repository import ContentRepository
from app.services.content_service import ContentService

_SYNC_ACTOR_ID = "blogger-sync"
_MAX_RETRIES = 3


def _redact(message: str, api_key: str | None) -> str:
    if api_key:
        message = message.replace(api_key, "***REDACTED***")
    return message


class BloggerSyncService:
    def __init__(
        self,
        content_repo: ContentRepository,
        activity_log: ActivityLogRepository,
        runs_repo: BloggerSyncRunsRepository,
    ):
        self._content_repo = content_repo
        self._content_service = ContentService(content_repo, COLLECTIONS["blog_posts"], activity_log)
        self._runs = runs_repo

    async def _fetch_with_retry(self, client: httpx.AsyncClient, url: str, params: dict) -> dict:
        last_error: Exception | None = None
        for attempt in range(_MAX_RETRIES):
            try:
                res = await client.get(url, params=params, timeout=15)
                res.raise_for_status()
                return res.json()
            except (httpx.HTTPError, ValueError) as exc:
                last_error = exc
                await asyncio.sleep(2**attempt)  # 1s, 2s, 4s backoff
        assert last_error is not None
        raise last_error

    async def run_once(self) -> dict:
        settings = get_settings()
        run = await self._runs.start()
        imported = 0
        skipped = 0
        error: str | None = None
        status = "error"

        if (
            not settings.blogger_sync_enabled
            or not settings.blogger_api_key
            or not settings.blogger_blog_url
        ):
            error = "Blogger sync is not enabled or not fully configured"
            await self._runs.finish(run["_id"], "error", imported, skipped, error)
            return {**run, "status": "error", "errorMessage": error}

        try:
            async with httpx.AsyncClient(base_url="https://www.googleapis.com/blogger/v3") as client:
                blog_info = await self._fetch_with_retry(
                    client,
                    "/blogs/byurl",
                    {"url": settings.blogger_blog_url, "key": settings.blogger_api_key},
                )
                blog_id = blog_info["id"]

                posts_page = await self._fetch_with_retry(
                    client,
                    f"/blogs/{blog_id}/posts",
                    {"key": settings.blogger_api_key, "maxResults": 50},
                )

                for post in posts_page.get("items", []):
                    external_id = post["id"]
                    existing = await self._content_repo.find_one_by("externalId", external_id)
                    if existing is not None:
                        # Never overwrite a manually-edited post — the conflict
                        # policy per techspec.md is "sync only creates, it
                        # never silently clobbers an admin's edits."
                        skipped += 1
                        continue

                    title = post.get("title", "Untitled")
                    content_html = post.get("content", "")
                    excerpt = re.sub(r"<[^>]+>", "", content_html)[:200]

                    await self._content_service.create(
                        {
                            "title": title,
                            "excerpt": excerpt,
                            "contentHtml": content_html,  # sanitized at render time, not here
                            "externalId": external_id,
                            "state": "published",
                            "publishDate": post.get("published", ""),
                        },
                        actor_id=_SYNC_ACTOR_ID,
                    )
                    imported += 1

            status = "success"
        except Exception as exc:  # noqa: BLE001 — sync must record *any* failure, not crash the loop
            status = "error"
            error = _redact(str(exc), settings.blogger_api_key)

        await self._runs.finish(run["_id"], status, imported, skipped, error)
        return {
            **run,
            "status": status,
            "postsImported": imported,
            "postsSkipped": skipped,
            "errorMessage": error,
        }
