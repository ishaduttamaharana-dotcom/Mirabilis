import pytest

from app.core.content_registry import COLLECTIONS, slugify
from app.services.content_service import ContentService
from app.utils.envelope import ApiError


class FakeContentRepo:
    """Minimal in-memory stand-in for ContentRepository — enough to exercise
    ContentService's validation/slug logic without a live Mongo instance
    (see docs/tracker.md: integration tests against real Mongo are a
    separate, still-open item)."""

    def __init__(self, name: str):
        self.name = name
        self._docs: dict[str, dict] = {}
        self._next_id = 1

    async def slug_exists(self, slug: str, exclude_id: str | None = None) -> bool:
        return any(
            d["slug"] == slug and item_id != exclude_id for item_id, d in self._docs.items()
        )

    async def insert(self, doc: dict) -> dict:
        item_id = str(self._next_id)
        self._next_id += 1
        doc["_id"] = item_id
        self._docs[item_id] = doc
        return doc

    async def get_by_id(self, item_id: str):
        return self._docs.get(item_id)

    async def update(self, item_id: str, patch: dict):
        self._docs[item_id].update(patch)
        return self._docs[item_id]

    async def delete(self, item_id: str) -> bool:
        return self._docs.pop(item_id, None) is not None

    async def list(self, page, page_size, sort, filters):
        return list(self._docs.values()), len(self._docs)


class NoOpActivityLog:
    async def record(self, *args, **kwargs) -> None:
        return None


def make_service(collection_name: str) -> ContentService:
    return ContentService(FakeContentRepo(collection_name), COLLECTIONS[collection_name], NoOpActivityLog())


def test_slugify_handles_punctuation_and_spacing():
    assert slugify("Golden Hour + Night Shoots!") == "golden-hour-night-shoots"


@pytest.mark.asyncio
async def test_create_rejects_missing_required_field():
    service = make_service("services")
    with pytest.raises(ApiError) as exc_info:
        await service.create({"subtitle": "no title"}, actor_id="u1")
    assert exc_info.value.status_code == 422
    assert "title" in exc_info.value.fields


@pytest.mark.asyncio
async def test_create_drops_unknown_fields_and_applies_defaults():
    service = make_service("services")
    doc = await service.create({"title": "Brand Films", "__proto__": "danger"}, actor_id="u1")
    assert "__proto__" not in doc
    assert doc["state"] == "draft"
    assert doc["visible"] is True
    assert doc["slug"] == "brand-films"


@pytest.mark.asyncio
async def test_duplicate_slug_gets_a_numeric_suffix():
    service = make_service("services")
    await service.create({"title": "Brand Films"}, actor_id="u1")
    second = await service.create({"title": "Brand Films"}, actor_id="u1")
    assert second["slug"] == "brand-films-2"


@pytest.mark.asyncio
async def test_update_rejects_wrong_type():
    service = make_service("services")
    doc = await service.create({"title": "Brand Films"}, actor_id="u1")
    with pytest.raises(ApiError):
        await service.update(doc["_id"], {"visible": "not-a-bool"}, actor_id="u1")


@pytest.mark.asyncio
async def test_update_missing_item_is_404():
    service = make_service("services")
    with pytest.raises(ApiError) as exc_info:
        await service.update("does-not-exist", {"title": "x"}, actor_id="u1")
    assert exc_info.value.status_code == 404


@pytest.mark.asyncio
async def test_enum_validation_on_state():
    service = make_service("blog_posts")
    with pytest.raises(ApiError) as exc_info:
        await service.create({"title": "Post", "state": "not-a-real-state"}, actor_id="u1")
    assert "state" in exc_info.value.fields
