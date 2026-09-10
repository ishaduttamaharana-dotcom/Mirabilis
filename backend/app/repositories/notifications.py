from __future__ import annotations

from datetime import UTC, datetime
from typing import Any

from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorDatabase


class NotificationsRepository:
    def __init__(self, db: AsyncIOMotorDatabase):
        self._collection = db["notifications"]

    async def create(
        self, notif_type: str, message: str, entity_ref: str | None, user_id: str | None = None
    ) -> dict[str, Any]:
        """user_id=None means broadcast to all admins (schema.md)."""
        doc = {
            "userId": user_id,
            "type": notif_type,
            "message": message,
            "entityRef": entity_ref,
            "read": False,
            "createdAt": datetime.now(UTC),
        }
        result = await self._collection.insert_one(doc)
        doc["_id"] = result.inserted_id
        return doc

    async def list_for_user(self, user_id: str, unread_only: bool = False) -> list[dict[str, Any]]:
        query: dict[str, Any] = {"$or": [{"userId": user_id}, {"userId": None}]}
        if unread_only:
            query["read"] = False
        cursor = self._collection.find(query).sort("createdAt", -1).limit(50)
        return [doc async for doc in cursor]

    async def unread_count(self, user_id: str) -> int:
        return await self._collection.count_documents(
            {"$or": [{"userId": user_id}, {"userId": None}], "read": False}
        )

    async def mark_read(self, notification_id: str) -> None:
        await self._collection.update_one(
            {"_id": ObjectId(notification_id)}, {"$set": {"read": True}}
        )
