from datetime import UTC, datetime
from typing import Any

from motor.motor_asyncio import AsyncIOMotorDatabase


class BloggerSyncRunsRepository:
    def __init__(self, db: AsyncIOMotorDatabase):
        self._collection = db["blogger_sync_runs"]

    async def start(self) -> dict[str, Any]:
        doc = {
            "startedAt": datetime.now(UTC),
            "finishedAt": None,
            "status": "running",
            "postsImported": 0,
            "postsSkipped": 0,
            "errorMessage": None,
        }
        result = await self._collection.insert_one(doc)
        doc["_id"] = result.inserted_id
        return doc

    async def finish(
        self, run_id: Any, status: str, imported: int, skipped: int, error: str | None = None
    ) -> None:
        await self._collection.update_one(
            {"_id": run_id},
            {
                "$set": {
                    "finishedAt": datetime.now(UTC),
                    "status": status,
                    "postsImported": imported,
                    "postsSkipped": skipped,
                    "errorMessage": error,
                }
            },
        )

    async def latest(self) -> dict[str, Any] | None:
        return await self._collection.find_one(sort=[("startedAt", -1)])

    async def list(self, page: int, page_size: int) -> tuple[list[dict[str, Any]], int]:
        total = await self._collection.count_documents({})
        cursor = (
            self._collection.find({})
            .sort("startedAt", -1)
            .skip((page - 1) * page_size)
            .limit(page_size)
        )
        items = [doc async for doc in cursor]
        return items, total
