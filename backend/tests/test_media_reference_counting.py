import pytest

from app.core.content_registry import COLLECTIONS
from app.services.content_service import ContentService


class FakeContentRepo:
    def __init__(self, name: str):
        self.name = name
        self._docs: dict[str, dict] = {}
        self._next_id = 1

    async def slug_exists(self, slug: str, exclude_id: str | None = None) -> bool:
        return any(d["slug"] == slug and item_id != exclude_id for item_id, d in self._docs.items())

    async def insert(self, doc: dict) -> dict:
        item_id = str(self._next_id)
        self._next_id += 1
        doc["_id"] = item_id
        self._docs[item_id] = doc
        return doc

    async def get_by_id(self, item_id: str):
        doc = self._docs.get(item_id)
        return dict(doc) if doc is not None else None

    async def update(self, item_id: str, patch: dict):
        self._docs[item_id].update(patch)
        return dict(self._docs[item_id])

    async def delete(self, item_id: str) -> bool:
        return self._docs.pop(item_id, None) is not None


class NoOpActivityLog:
    async def record(self, *args, **kwargs) -> None:
        return None


class FakeMediaService:
    """Records reference()/dereference() calls instead of touching Mongo."""

    def __init__(self):
        self.refs: dict[str, int] = {}

    async def reference(self, media_id: str) -> None:
        self.refs[media_id] = self.refs.get(media_id, 0) + 1

    async def dereference(self, media_id: str) -> None:
        self.refs[media_id] = self.refs.get(media_id, 0) - 1


@pytest.mark.asyncio
async def test_create_references_all_media_fields():
    media = FakeMediaService()
    service = ContentService(
        FakeContentRepo("services"), COLLECTIONS["services"], NoOpActivityLog(), media
    )
    await service.create(
        {"title": "Brand Films", "heroMedia": "m1", "cardImage": "m2", "gallery": ["m3", "m4"]},
        actor_id="u1",
    )
    assert media.refs == {"m1": 1, "m2": 1, "m3": 1, "m4": 1}


@pytest.mark.asyncio
async def test_update_dereferences_removed_media_and_references_new():
    media = FakeMediaService()
    service = ContentService(
        FakeContentRepo("services"), COLLECTIONS["services"], NoOpActivityLog(), media
    )
    doc = await service.create({"title": "Brand Films", "heroMedia": "m1"}, actor_id="u1")
    await service.update(doc["_id"], {"heroMedia": "m2"}, actor_id="u1")
    assert media.refs["m1"] == 0  # dereferenced
    assert media.refs["m2"] == 1  # newly referenced


@pytest.mark.asyncio
async def test_delete_dereferences_all_media():
    media = FakeMediaService()
    service = ContentService(
        FakeContentRepo("services"), COLLECTIONS["services"], NoOpActivityLog(), media
    )
    doc = await service.create({"title": "Brand Films", "cardImage": "m9"}, actor_id="u1")
    await service.delete(doc["_id"], actor_id="u1")
    assert media.refs["m9"] == 0


@pytest.mark.asyncio
async def test_media_repo_supports_key_and_url_lookups():
    from app.repositories.media import MediaRepository

    class FakeCollection:
        def __init__(self):
            self.docs = [{"_id": "obj1", "key": "images/test.png", "referenceCount": 0}]

        async def find_one(self, query):
            if "_id" in query:
                for d in self.docs:
                    if d["_id"] == query["_id"]:
                        return d
            if "key" in query:
                for d in self.docs:
                    if d["key"] == query["key"]:
                        return d
            return None

        async def update_one(self, query, update):
            doc = await self.find_one(query)
            if doc and "$inc" in update:
                doc["referenceCount"] += update["$inc"].get("referenceCount", 0)

    fake_db = {"media": FakeCollection()}
    repo = MediaRepository(fake_db)

    await repo.increment_ref("/uploads/images/test.png", 1)
    doc = await repo.get_by_id_or_key("/uploads/images/test.png")
    assert doc is not None
    assert doc["referenceCount"] == 1

