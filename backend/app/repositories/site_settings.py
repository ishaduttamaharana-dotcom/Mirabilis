from datetime import UTC, datetime
from typing import Any

from motor.motor_asyncio import AsyncIOMotorDatabase

_SINGLETON_ID = "site_settings"


class SiteSettingsRepository:
    """A single document keyed by a fixed id — there is exactly one
    site_settings record, so this repo has no create/list, just get/upsert."""

    def __init__(self, db: AsyncIOMotorDatabase):
        self._collection = db["site_settings"]

    async def get(self) -> dict[str, Any] | None:
        return await self._collection.find_one({"_id": _SINGLETON_ID})

    async def upsert(self, patch: dict[str, Any]) -> dict[str, Any]:
        patch["updatedAt"] = datetime.now(UTC)
        await self._collection.update_one(
            {"_id": _SINGLETON_ID},
            {"$set": patch, "$setOnInsert": {"createdAt": datetime.now(UTC)}},
            upsert=True,
        )
        doc = await self.get()
        assert doc is not None
        return doc
