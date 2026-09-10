from typing import Any

from fastapi import APIRouter, Depends, Query

from app.core.content_registry import COLLECTIONS
from app.core.db import get_db
from app.core.rbac import CurrentUser, require_editor, require_viewer
from app.repositories.activity_log import ActivityLogRepository
from app.repositories.content_repository import ContentRepository
from app.repositories.media import MediaRepository
from app.services.content_service import ContentService
from app.services.media_service import MediaService
from app.services.storage import get_storage_adapter
from app.utils.envelope import ApiError, data, paginated


def _serialize(doc: dict[str, Any]) -> dict[str, Any]:
    out = dict(doc)
    out["id"] = str(out.pop("_id"))
    return out


def _service(collection_name: str) -> ContentService:
    db = get_db()
    spec = COLLECTIONS[collection_name]
    media_service = MediaService(MediaRepository(db), get_storage_adapter())
    return ContentService(
        ContentRepository(db, collection_name), spec, ActivityLogRepository(db), media_service
    )


def build_admin_router(collection_name: str) -> APIRouter:
    """Admin-authenticated CRUD for one collection. RBAC: viewer can read,
    editor+ can write — enforced here server-side, not just hidden in the UI
    (security.md)."""
    router = APIRouter(prefix=f"/admin/{collection_name}", tags=[f"admin:{collection_name}"])

    @router.get("")
    async def list_items(
        page: int = Query(1, ge=1),
        page_size: int = Query(20, ge=1, le=100),
        state: str | None = None,
        _: CurrentUser = Depends(require_viewer),
    ):
        filters = {"state": state} if state else None
        items, total = await _service(collection_name).list(page, page_size, filters=filters)
        return paginated([_serialize(i) for i in items], page, page_size, total)

    @router.get("/{item_id}")
    async def get_item(item_id: str, _: CurrentUser = Depends(require_viewer)):
        doc = await _service(collection_name).get(item_id)
        return data(_serialize(doc))

    @router.post("")
    async def create_item(payload: dict[str, Any], user: CurrentUser = Depends(require_editor)):
        doc = await _service(collection_name).create(payload, user.user_id)
        return data(_serialize(doc))

    @router.put("/{item_id}")
    async def update_item(
        item_id: str, payload: dict[str, Any], user: CurrentUser = Depends(require_editor)
    ):
        doc = await _service(collection_name).update(item_id, payload, user.user_id)
        return data(_serialize(doc))

    @router.post("/{item_id}/duplicate")
    async def duplicate_item(item_id: str, user: CurrentUser = Depends(require_editor)):
        doc = await _service(collection_name).duplicate(item_id, user.user_id)
        return data(_serialize(doc))

    @router.post("/reorder")
    async def reorder_items(
        payload: dict[str, Any], user: CurrentUser = Depends(require_editor)
    ):
        items = payload.get("items", [])
        service = _service(collection_name)
        updated = []
        for item in items:
            item_id = item.get("id")
            sort_order = item.get("sortOrder")
            if item_id and sort_order is not None:
                doc = await service.update(item_id, {"sortOrder": sort_order}, user.user_id)
                updated.append(_serialize(doc))
        return data({"reordered": True, "count": len(updated)})

    @router.delete("/{item_id}")
    async def delete_item(item_id: str, user: CurrentUser = Depends(require_editor)):
        await _service(collection_name).delete(item_id, user.user_id)
        return data({"deleted": True})

    return router


def build_public_router(collection_name: str) -> APIRouter:
    """Unauthenticated read-only endpoints returning only published/visible
    content — this is what the public Vite site consumes."""
    spec = COLLECTIONS[collection_name]
    router = APIRouter(prefix=f"/public/{collection_name}", tags=[f"public:{collection_name}"])

    @router.get("")
    async def list_public(page: int = Query(1, ge=1), page_size: int = Query(50, ge=1, le=100)):
        items, total = await _service(collection_name).list(
            page, page_size, filters=dict(spec["public_filter"])
        )
        return paginated([_serialize(i) for i in items], page, page_size, total)

    if spec.get("slug_field"):

        @router.get("/{slug}")
        async def get_by_slug(slug: str):
            db = get_db()
            repo = ContentRepository(db, collection_name)
            doc = await repo.get_by_slug(slug)
            if doc is None or not all(doc.get(k) == v for k, v in spec["public_filter"].items()):
                raise ApiError(404, "NOT_FOUND", "Not found")
            return data(_serialize(doc))

    return router


def all_admin_routers() -> list[APIRouter]:
    return [build_admin_router(name) for name in COLLECTIONS]


def all_public_routers() -> list[APIRouter]:
    return [build_public_router(name) for name in COLLECTIONS]
