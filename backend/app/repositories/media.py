from __future__ import annotations

from datetime import UTC, datetime
from typing import Any, List  # noqa: UP035 (List kept to dodge a mypy / "list" method-name collision)

from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorDatabase


class MediaRepository:
    def __init__(self, db: AsyncIOMotorDatabase):
        self._collection = db["media"]

    async def create(
        self,
        key: str,
        category: str,
        mime_type: str,
        size: int,
        alt_text: str,
        uploaded_by: str,
        width: int | None = None,
        height: int | None = None,
        duration_seconds: float | None = None,
    ) -> dict[str, Any]:
        now = datetime.now(UTC)
        doc = {
            "key": key,
            "category": category,
            "mimeType": mime_type,
            "size": size,
            "width": width,
            "height": height,
            "durationSeconds": duration_seconds,
            "referenceCount": 0,
            "altText": alt_text,
            "uploadedBy": uploaded_by,
            "createdAt": now,
            "updatedAt": now,
        }
        result = await self._collection.insert_one(doc)
        doc["_id"] = result.inserted_id
        return doc

    async def get_by_id(self, media_id: str) -> dict[str, Any] | None:
        if not ObjectId.is_valid(media_id):
            return None
        return await self._collection.find_one({"_id": ObjectId(media_id)})

    async def list(
        self, page: int, page_size: int, category: str | None = None
    ) -> tuple[list[dict[str, Any]], int]:
        query = {"category": category} if category else {}
        total = await self._collection.count_documents(query)
        cursor = (
            self._collection.find(query)
            .sort("createdAt", -1)
            .skip((page - 1) * page_size)
            .limit(page_size)
        )
        items = [doc async for doc in cursor]
        return items, total

    async def increment_ref(self, media_id: str, delta: int = 1) -> None:
        if not ObjectId.is_valid(media_id):
            return
        await self._collection.update_one(
            {"_id": ObjectId(media_id)},
            {"$inc": {"referenceCount": delta}, "$set": {"updatedAt": datetime.now(UTC)}},
        )

    async def delete(self, media_id: str) -> None:
        if not ObjectId.is_valid(media_id):
            return
        await self._collection.delete_one({"_id": ObjectId(media_id)})

    async def find_orphaned(self) -> List[dict[str, Any]]:  # noqa: UP006 (mypy: see "list" method name collision above)
        return [doc async for doc in self._collection.find({"referenceCount": {"$lte": 0}})]
