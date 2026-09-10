from fastapi import APIRouter, Depends, Query

from app.core.db import get_db
from app.core.rbac import CurrentUser, require_editor, require_viewer
from app.repositories.activity_log import ActivityLogRepository
from app.repositories.blogger_sync_runs import BloggerSyncRunsRepository
from app.repositories.content_repository import ContentRepository
from app.services.blogger_sync_service import BloggerSyncService
from app.utils.envelope import data, paginated

router = APIRouter(prefix="/admin/blogger-sync", tags=["admin:blogger-sync"])


def _service() -> BloggerSyncService:
    db = get_db()
    return BloggerSyncService(
        ContentRepository(db, "blog_posts"), ActivityLogRepository(db), BloggerSyncRunsRepository(db)
    )


def _serialize(doc: dict) -> dict:
    out = dict(doc)
    out["id"] = str(out.pop("_id"))
    return out


@router.post("/run")
async def trigger_sync(user: CurrentUser = Depends(require_editor)):
    run = await _service().run_once()
    activity_log = ActivityLogRepository(get_db())
    await activity_log.record(user.user_id, "sync", "blog_posts", None)
    return data(_serialize(run))


@router.get("/runs")
async def list_runs(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    _: CurrentUser = Depends(require_viewer),
):
    repo = BloggerSyncRunsRepository(get_db())
    items, total = await repo.list(page, page_size)
    return paginated([_serialize(i) for i in items], page, page_size, total)
