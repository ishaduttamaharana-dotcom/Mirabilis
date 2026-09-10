from typing import Any

from fastapi import APIRouter, Depends, Query

from app.core.db import get_db
from app.core.rbac import CurrentUser, require_viewer
from app.repositories.activity_log import ActivityLogRepository
from app.utils.envelope import paginated

router = APIRouter(prefix="/admin/activity-log", tags=["admin:activity-log"])


def _serialize(doc: dict[str, Any]) -> dict[str, Any]:
    out = dict(doc)
    out["id"] = str(out.pop("_id"))
    return out


@router.get("")
async def list_activity(
    page: int = Query(1, ge=1),
    page_size: int = Query(30, ge=1, le=100),
    collection: str | None = None,
    action: str | None = None,
    _: CurrentUser = Depends(require_viewer),
):
    filters: dict[str, Any] = {}
    if collection:
        filters["collection"] = collection
    if action:
        filters["action"] = action
    repo = ActivityLogRepository(get_db())
    items, total = await repo.list(page, page_size, filters)
    return paginated([_serialize(i) for i in items], page, page_size, total)
