from typing import Any

from app.core.crypto import encrypt_secret
from app.repositories.site_settings import SiteSettingsRepository

# Fields accepted on write. Secrets (smtpPassword, bloggerApiKey) are handled
# separately: encrypted before storage, never echoed back in plaintext.
_PLAIN_FIELDS = {
    "siteTitle",
    "defaultTitleTemplate",
    "defaultMetaDescription",
    "defaultOgImage",
    "contactEmail",
    "contactPhone",
    "contactAddress",
    "socialFacebook",
    "socialInstagram",
    "socialX",
    "socialLinkedin",
    "socialYoutube",
    "socialWhatsapp",
    "smtpHost",
    "smtpPort",
    "smtpUsername",
    "smtpFromName",
    "bloggerBlogUrl",
    "bloggerSyncIntervalMinutes",
    "bloggerSyncEnabled",
    "seoVerificationTokens",
    "adminBrandingName",
}
_SECRET_FIELDS = {"smtpPassword", "bloggerApiKey"}


class SiteSettingsService:
    def __init__(self, repo: SiteSettingsRepository):
        self._repo = repo

    def _redact(self, doc: dict[str, Any]) -> dict[str, Any]:
        out = {k: v for k, v in doc.items() if k not in _SECRET_FIELDS and k != "_id"}
        for secret_field in _SECRET_FIELDS:
            out[f"{secret_field}Configured"] = bool(doc.get(secret_field))
        return out

    async def get(self) -> dict[str, Any]:
        doc = await self._repo.get() or {}
        return self._redact(doc)

    async def update(self, payload: dict[str, Any], actor_id: str) -> dict[str, Any]:
        patch: dict[str, Any] = {k: v for k, v in payload.items() if k in _PLAIN_FIELDS}
        for secret_field in _SECRET_FIELDS:
            value = payload.get(secret_field)
            if value:  # only re-encrypt if a new value was actually sent
                patch[secret_field] = encrypt_secret(value)
        patch["updatedBy"] = actor_id
        doc = await self._repo.upsert(patch)
        return self._redact(doc)
