import pytest

from app.core.crypto import decrypt_secret, encrypt_secret
from app.services.site_settings_service import SiteSettingsService


class FakeSiteSettingsRepo:
    def __init__(self):
        self._doc: dict = {}

    async def get(self):
        return dict(self._doc) if self._doc else None

    async def upsert(self, patch: dict):
        self._doc.update(patch)
        return dict(self._doc)


def test_encrypt_decrypt_roundtrip():
    ciphertext = encrypt_secret("hunter2")
    assert ciphertext != "hunter2"
    assert decrypt_secret(ciphertext) == "hunter2"


def test_decrypt_garbage_returns_none():
    assert decrypt_secret("not-a-real-token") is None


@pytest.mark.asyncio
async def test_settings_get_never_leaks_smtp_password():
    service = SiteSettingsService(FakeSiteSettingsRepo())
    await service.update({"smtpHost": "smtp.example.com", "smtpPassword": "s3cret"}, actor_id="u1")
    result = await service.get()
    assert "smtpPassword" not in result
    assert result["smtpPasswordConfigured"] is True
    assert result["smtpHost"] == "smtp.example.com"


@pytest.mark.asyncio
async def test_settings_update_ignores_unknown_fields():
    service = SiteSettingsService(FakeSiteSettingsRepo())
    result = await service.update({"siteTitle": "Mirabilis", "__proto__": "danger"}, actor_id="u1")
    assert "__proto__" not in result
    assert result["siteTitle"] == "Mirabilis"


@pytest.mark.asyncio
async def test_settings_empty_state_reports_secrets_not_configured():
    service = SiteSettingsService(FakeSiteSettingsRepo())
    result = await service.get()
    assert result["smtpPasswordConfigured"] is False
    assert result["bloggerApiKeyConfigured"] is False
