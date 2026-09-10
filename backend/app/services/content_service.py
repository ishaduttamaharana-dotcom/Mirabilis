from __future__ import annotations

from typing import Any

from app.core.content_registry import CollectionSpec, slugify
from app.repositories.activity_log import ActivityLogRepository
from app.repositories.content_repository import ContentRepository
from app.services.media_service import MediaService
from app.utils.envelope import ApiError


class ContentService:
    """Generic CRUD business logic shared by every CMS collection.

    Every write goes through `_validate`, which enforces the collection's
    explicit field allowlist (content_registry.py) — unknown fields are
    dropped, required fields are enforced, enums are checked, and types are
    checked. This is the "safe abstraction" rules.md requires instead of a
    raw pass-through CRUD route.
    """

    def __init__(
        self,
        repo: ContentRepository,
        spec: CollectionSpec,
        activity_log: ActivityLogRepository,
        media_service: MediaService | None = None,
    ):
        self._repo = repo
        self._spec = spec
        self._activity_log = activity_log
        self._media_service = media_service

    def _media_ids(self, doc: dict[str, Any]) -> set[str]:
        """Flattens every media id referenced by this document's
        media_fields (each field may hold a single id or a list of ids)."""
        ids: set[str] = set()
        for field in self._spec.get("media_fields", []):
            value = doc.get(field)
            if not value:
                continue
            if isinstance(value, list):
                ids.update(v for v in value if isinstance(v, str))
            elif isinstance(value, str):
                ids.add(value)
        return ids

    async def _apply_media_diff(self, old_doc: dict[str, Any] | None, new_doc: dict[str, Any]) -> None:
        if self._media_service is None or not self._spec.get("media_fields"):
            return
        old_ids = self._media_ids(old_doc) if old_doc else set()
        new_ids = self._media_ids(new_doc)
        for media_id in new_ids - old_ids:
            await self._media_service.reference(media_id)
        for media_id in old_ids - new_ids:
            await self._media_service.dereference(media_id)

    def _validate(self, payload: dict[str, Any], *, partial: bool) -> dict[str, Any]:
        fields = self._spec["fields"]
        out: dict[str, Any] = {}
        errors: dict[str, str] = {}

        for name, rules in fields.items():
            has_value = name in payload
            if has_value:
                value = payload[name]
                expected_type = rules.get("type")
                if expected_type and value is not None and not isinstance(value, expected_type):
                    errors[name] = f"expected {expected_type.__name__}"
                    continue
                enum = rules.get("enum")
                if enum and value not in enum:
                    errors[name] = f"must be one of {enum}"
                    continue
                out[name] = value
            elif not partial:
                if rules.get("required"):
                    errors[name] = "required"
                elif "default" in rules:
                    out[name] = rules["default"]

        if errors:
            raise ApiError(422, "VALIDATION_ERROR", "Invalid content payload", fields=errors)
        return out

    async def _unique_slug(self, base: str, exclude_id: str | None = None) -> str:
        candidate = slugify(base)
        suffix = 2
        while await self._repo.slug_exists(candidate, exclude_id=exclude_id):
            candidate = f"{slugify(base)}-{suffix}"
            suffix += 1
        return candidate

    async def list(
        self, page: int, page_size: int, sort_field: str = "sortOrder", sort_dir: int = 1,
        filters: dict[str, Any] | None = None,
    ) -> tuple[list[dict[str, Any]], int]:
        return await self._repo.list(page, page_size, (sort_field, sort_dir), filters)

    async def get(self, item_id: str) -> dict[str, Any]:
        doc = await self._repo.get_by_id(item_id)
        if doc is None:
            raise ApiError(404, "NOT_FOUND", f"{self._repo.name} item not found")
        return doc

    async def create(self, payload: dict[str, Any], actor_id: str) -> dict[str, Any]:
        clean = self._validate(payload, partial=False)
        if self._spec.get("slug_field"):
            source = clean.get("slug") or clean.get("title") or clean.get("name") or "item"
            clean["slug"] = await self._unique_slug(source)
        clean["createdBy"] = actor_id
        clean["updatedBy"] = actor_id
        doc = await self._repo.insert(clean)
        await self._apply_media_diff(None, doc)
        await self._activity_log.record(actor_id, "create", self._repo.name, str(doc["_id"]))
        return doc

    async def update(self, item_id: str, payload: dict[str, Any], actor_id: str) -> dict[str, Any]:
        before = await self.get(item_id)  # 404s if missing
        clean = self._validate(payload, partial=True)
        if self._spec.get("slug_field") and "slug" in clean:
            clean["slug"] = await self._unique_slug(clean["slug"], exclude_id=item_id)
        clean["updatedBy"] = actor_id
        doc = await self._repo.update(item_id, clean)
        assert doc is not None
        await self._apply_media_diff(before, doc)
        diff = {k: v for k, v in clean.items() if k != "updatedBy"}
        await self._activity_log.record(actor_id, "update", self._repo.name, item_id, diff=diff)
        return doc

    async def duplicate(self, item_id: str, actor_id: str) -> dict[str, Any]:
        original = await self.get(item_id)
        clone = {k: v for k, v in original.items() if k not in ("_id", "createdAt", "updatedAt")}
        if self._spec.get("slug_field") and "slug" in clone:
            clone["slug"] = await self._unique_slug(f"{clone['slug']}-copy")
        if "state" in clone:
            clone["state"] = "draft"
        clone["createdBy"] = actor_id
        clone["updatedBy"] = actor_id
        doc = await self._repo.insert(clone)
        await self._apply_media_diff(None, doc)
        await self._activity_log.record(actor_id, "create", self._repo.name, str(doc["_id"]))
        return doc

    async def delete(self, item_id: str, actor_id: str) -> None:
        doc = await self.get(item_id)  # 404s if missing
        await self._repo.delete(item_id)
        await self._apply_media_diff(doc, {})
        await self._activity_log.record(actor_id, "delete", self._repo.name, item_id)
