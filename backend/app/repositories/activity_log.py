from __future__ import annotations

from datetime import UTC, datetime
from typing import Any

from motor.motor_asyncio import AsyncIOMotorDatabase


class ActivityLogRepository:
    def __init__(self, db: AsyncIOMotorDatabase):
        self._collection = db["activity_logs"]

    async def record(
        self,
        actor_id: str,
        action: str,
        collection: str,
        target_id: str | None,
        diff: dict[str, Any] | None = None,
    ) -> None:
        """diff must already be secret-redacted by the caller — this layer
        does not know which fields are sensitive per collection."""
        await self._collection.insert_one(
            {
                "actorId": actor_id,
                "action": action,
                "collection": collection,
                "targetId": target_id,
                "diff": diff or {},
                "createdAt": datetime.now(UTC),
            }
        )

    async def list(
        self, page: int, page_size: int, filters: dict[str, Any] | None = None
    ) -> tuple[list[dict[str, Any]], int]:
        query = filters or {}
        total = await self._collection.count_documents(query)
        cursor = (
            self._collection.find(query)
            .sort("createdAt", -1)
            .skip((page - 1) * page_size)
            .limit(page_size)
        )
        items = [doc async for doc in cursor]
        return items, total
