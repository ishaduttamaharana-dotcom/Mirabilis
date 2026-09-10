import pytest

from app.services.blogger_sync_service import BloggerSyncService, _redact


class FakeContentRepo:
    name = "blog_posts"

    def __init__(self, existing_external_ids=None):
        self._existing = set(existing_external_ids or [])
        self.inserted = []

    async def find_one_by(self, field, value):
        if field == "externalId" and value in self._existing:
            return {"externalId": value}
        return None

    async def slug_exists(self, slug, exclude_id=None):
        return False

    async def insert(self, doc):
        doc["_id"] = f"id-{len(self.inserted)}"
        self.inserted.append(doc)
        return doc


class NoOpActivityLog:
    async def record(self, *args, **kwargs):
        return None


class FakeRunsRepo:
    def __init__(self):
        self.started = 0
        self.finished = []

    async def start(self):
        self.started += 1
        return {"_id": f"run-{self.started}"}

    async def finish(self, run_id, status, imported, skipped, error=None):
        self.finished.append(
            {"run_id": run_id, "status": status, "imported": imported, "skipped": skipped, "error": error}
        )


def test_redact_removes_api_key_from_error_message():
    msg = "request failed: key=SECRET123 was rejected"
    assert "SECRET123" not in _redact(msg, "SECRET123")


def test_redact_noop_when_no_api_key():
    msg = "some generic error"
    assert _redact(msg, None) == msg


@pytest.mark.asyncio
async def test_run_once_skips_when_not_configured(monkeypatch):
    from app.core.config import Settings

    monkeypatch.setattr(
        "app.services.blogger_sync_service.get_settings",
        lambda: Settings(blogger_sync_enabled=False),
    )
    runs_repo = FakeRunsRepo()
    service = BloggerSyncService(FakeContentRepo(), NoOpActivityLog(), runs_repo)
    result = await service.run_once()
    assert result["status"] == "error"
    assert "not enabled" in result["errorMessage"]
    assert runs_repo.finished[0]["imported"] == 0
