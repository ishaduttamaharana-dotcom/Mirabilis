from __future__ import annotations

from typing import Any

from app.core.upload_validation import probe_dimensions, strip_image_metadata, validate_upload
from app.repositories.media import MediaRepository
from app.services.storage import StorageAdapter
from app.utils.envelope import ApiError


class MediaService:
    def __init__(self, repo: MediaRepository, storage: StorageAdapter):
        self._repo = repo
        self._storage = storage

    async def upload(
        self, filename: str, declared_mime: str, content: bytes, alt_text: str, uploaded_by: str
    ) -> dict[str, Any]:
        ext, category = validate_upload(filename, declared_mime, content)
        clean_content = strip_image_metadata(content, ext)
        width, height = probe_dimensions(clean_content, ext)
        key = await self._storage.save(category, ext, clean_content)
        doc = await self._repo.create(
            key=key,
            category=category,
            mime_type=declared_mime,
            size=len(clean_content),
            alt_text=alt_text,
            uploaded_by=uploaded_by,
            width=width,
            height=height,
        )
        return doc

    async def get_or_404(self, media_id: str) -> dict[str, Any]:
        doc = await self._repo.get_by_id(media_id)
        if doc is None:
            raise ApiError(404, "NOT_FOUND", "Media item not found")
        return doc

    async def list(self, page: int, page_size: int, category: str | None = None):
        return await self._repo.list(page, page_size, category)

    async def reference(self, media_id: str) -> None:
        if not media_id:
            return
        await self._repo.increment_ref(media_id, +1)

    async def dereference(self, media_id: str) -> None:
        """Decrements the reference count and deletes the underlying object
        + document only once no references remain (rules.md media lifecycle:
        "remove physical storage only once no references remain")."""
        if not media_id:
            return
        await self._repo.increment_ref(media_id, -1)
        doc = await self._repo.get_by_id(media_id)
        if doc is not None and doc.get("referenceCount", 0) <= 0:
            await self._storage.delete(doc["key"])
            await self._repo.delete(media_id)

    async def delete_with_reference_check(self, media_id: str) -> None:
        doc = await self.get_or_404(media_id)
        if doc.get("referenceCount", 0) > 0:
            raise ApiError(
                409,
                "MEDIA_REFERENCED",
                f"Still referenced by {doc['referenceCount']} item(s) — remove those references first",
            )
        await self._storage.delete(doc["key"])
        await self._repo.delete(media_id)
