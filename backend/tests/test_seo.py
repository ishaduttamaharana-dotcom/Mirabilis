import pytest
from fastapi.testclient import TestClient

from app.api.v1 import seo as seo_module
from app.main import app


class FakeSiteSettingsRepo:
    async def get(self):
        return None  # falls back to Settings.frontend_base_url


class FakeContentRepo:
    def __init__(self, items):
        self._items = items

    async def list(self, page, page_size, sort, filters):
        return self._items, len(self._items)


@pytest.fixture
def client(monkeypatch):
    monkeypatch.setattr(seo_module, "SiteSettingsRepository", lambda db: FakeSiteSettingsRepo())

    def fake_content_repo(db, name):
        if name == "services":
            return FakeContentRepo([{"slug": "brand-films"}])
        return FakeContentRepo([])

    monkeypatch.setattr(seo_module, "ContentRepository", fake_content_repo)
    return TestClient(app)


from app.core.config import get_settings


def test_sitemap_includes_static_and_slugged_routes(client):
    base_url = get_settings().frontend_base_url.rstrip("/")
    res = client.get("/sitemap.xml")
    assert res.status_code == 200
    assert "application/xml" in res.headers["content-type"]
    assert f"<loc>{base_url}/</loc>" in res.text
    assert f"<loc>{base_url}/services/brand-films</loc>" in res.text


def test_robots_references_sitemap(client):
    base_url = get_settings().frontend_base_url.rstrip("/")
    res = client.get("/robots.txt")
    assert res.status_code == 200
    assert f"Sitemap: {base_url}/sitemap.xml" in res.text
    assert "Disallow: /admin" in res.text

