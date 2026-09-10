from __future__ import annotations

from datetime import UTC, datetime
from typing import Any

from bson import ObjectId
from bson.errors import InvalidId
from motor.motor_asyncio import AsyncIOMotorDatabase


class ContentRepository:
    """Generic repository reused by every CMS collection.

    Field-level safety (what's allowed in, what's required, defaults, enums)
    lives one layer up in ContentService + content_registry.py — this class
    only knows how to move already-validated documents in and out of Mongo.
    """

    def __init__(self, db: AsyncIOMotorDatabase, collection_name: str):
        self._collection = db[collection_name]
        self.name = collection_name

    @staticmethod
    def _oid(item_id: str) -> ObjectId:
        try:
            return ObjectId(item_id)
        except InvalidId as exc:
            raise ValueError(f"Invalid id: {item_id}") from exc

    async def list(
        self,
        page: int,
        page_size: int,
        sort: tuple[str, int] = ("sortOrder", 1),
        filters: dict[str, Any] | None = None,
    ) -> tuple[list[dict[str, Any]], int]:
        query = filters or {}
        total = await self._collection.count_documents(query)
        cursor = (
            self._collection.find(query)
            .sort(*sort)
            .skip((page - 1) * page_size)
            .limit(page_size)
        )
        items = [doc async for doc in cursor]
        return items, total

    async def get_by_id(self, item_id: str) -> dict[str, Any] | None:
        return await self._collection.find_one({"_id": self._oid(item_id)})

    async def get_by_slug(self, slug: str) -> dict[str, Any] | None:
        return await self._collection.find_one({"slug": slug})

    async def find_one_by(self, field: str, value: Any) -> dict[str, Any] | None:
        return await self._collection.find_one({field: value})

    async def slug_exists(self, slug: str, exclude_id: str | None = None) -> bool:
        query: dict[str, Any] = {"slug": slug}
        if exclude_id:
            query["_id"] = {"$ne": self._oid(exclude_id)}
        return await self._collection.count_documents(query) > 0

    async def insert(self, doc: dict[str, Any]) -> dict[str, Any]:
        now = datetime.now(UTC)
        doc["createdAt"] = now
        doc["updatedAt"] = now
        result = await self._collection.insert_one(doc)
        doc["_id"] = result.inserted_id
        return doc

    async def update(self, item_id: str, patch: dict[str, Any]) -> dict[str, Any] | None:
        patch["updatedAt"] = datetime.now(UTC)
        await self._collection.update_one({"_id": self._oid(item_id)}, {"$set": patch})
        return await self.get_by_id(item_id)

    async def delete(self, item_id: str) -> bool:
        result = await self._collection.delete_one({"_id": self._oid(item_id)})
        return result.deleted_count > 0
