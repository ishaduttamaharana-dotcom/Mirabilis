import pytest

from app.services.media_service import MediaService
from app.utils.envelope import ApiError

_PNG = b"\x89PNG\r\n\x1a\n" + b"\x00" * 32


class FakeMediaRepo:
    def __init__(self):
        self._docs = {}
        self._next = 1

    async def create(
        self,
        key,
        category,
        mime_type,
        size,
        alt_text,
        uploaded_by,
        width=None,
        height=None,
        duration_seconds=None,
    ):
        item_id = str(self._next)
        self._next += 1
        doc = {
            "_id": item_id,
            "key": key,
            "category": category,
            "mimeType": mime_type,
            "size": size,
            "altText": alt_text,
            "uploadedBy": uploaded_by,
            "referenceCount": 0,
        }
        self._docs[item_id] = doc
        return doc

    async def get_by_id(self, media_id):
        return self._docs.get(media_id)

    async def increment_ref(self, media_id, delta=1):
        self._docs[media_id]["referenceCount"] += delta

    async def delete(self, media_id):
        self._docs.pop(media_id, None)

    async def list(self, page, page_size, category=None):
        items = list(self._docs.values())
        return items, len(items)


class FakeStorage:
    def __init__(self):
        self.saved = []
        self.deleted = []

    async def save(self, category, extension, content):
        key = f"{category}/fake.{extension}"
        self.saved.append(key)
        return key

    async def delete(self, key):
        self.deleted.append(key)

    def public_url(self, key):
        return f"/uploads/{key}"


@pytest.mark.asyncio
async def test_upload_stores_file_and_creates_media_doc():
    repo = FakeMediaRepo()
    storage = FakeStorage()
    service = MediaService(repo, storage)
    doc = await service.upload("photo.png", "image/png", _PNG, "a photo", "user-1")
    assert doc["referenceCount"] == 0
    assert storage.saved == [doc["key"]]


@pytest.mark.asyncio
async def test_upload_rejects_disguised_file():
    repo = FakeMediaRepo()
    service = MediaService(repo, FakeStorage())
    with pytest.raises(ApiError):
        await service.upload("shell.php", "application/x-php", b"<?php ?>", "x", "user-1")


@pytest.mark.asyncio
async def test_dereference_deletes_only_when_count_reaches_zero():
    repo = FakeMediaRepo()
    storage = FakeStorage()
    service = MediaService(repo, storage)
    doc = await service.upload("photo.png", "image/png", _PNG, "a photo", "user-1")
    media_id = doc["_id"]

    await service.reference(media_id)
    await service.reference(media_id)
    await service.dereference(media_id)
    assert await repo.get_by_id(media_id) is not None  # still referenced once
    assert storage.deleted == []

    await service.dereference(media_id)
    assert await repo.get_by_id(media_id) is None  # now fully dereferenced
    assert storage.deleted == [doc["key"]]


@pytest.mark.asyncio
async def test_delete_with_reference_check_blocks_when_referenced():
    repo = FakeMediaRepo()
    service = MediaService(repo, FakeStorage())
    doc = await service.upload("photo.png", "image/png", _PNG, "a photo", "user-1")
    await service.reference(doc["_id"])

    with pytest.raises(ApiError) as exc_info:
        await service.delete_with_reference_check(doc["_id"])
    assert exc_info.value.code == "MEDIA_REFERENCED"


@pytest.mark.asyncio
async def test_delete_with_reference_check_succeeds_when_unreferenced():
    repo = FakeMediaRepo()
    storage = FakeStorage()
    service = MediaService(repo, storage)
    doc = await service.upload("photo.png", "image/png", _PNG, "a photo", "user-1")

    await service.delete_with_reference_check(doc["_id"])
    assert await repo.get_by_id(doc["_id"]) is None
    assert storage.deleted == [doc["key"]]
