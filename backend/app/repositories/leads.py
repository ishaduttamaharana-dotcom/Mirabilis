from __future__ import annotations

from datetime import UTC, datetime
from typing import Any

from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorDatabase

LEAD_STATUSES = ["new", "contacted", "qualified", "proposal_sent", "won", "lost", "spam"]


class LeadsRepository:
    def __init__(self, db: AsyncIOMotorDatabase):
        self._collection = db["leads"]

    async def create(self, payload: dict[str, Any]) -> dict[str, Any]:
        now = datetime.now(UTC)
        doc = {
            "name": payload["name"],
            "email": payload["email"],
            "phone": payload.get("phone"),
            "company": payload.get("company"),
            "serviceInterest": payload.get("serviceInterest"),
            "message": payload.get("message", ""),
            "attachments": payload.get("attachments", []),
            "source": payload.get("source", "website"),
            "status": "new",
            "assignedTo": None,
            "createdAt": now,
            "updatedAt": now,
        }
        result = await self._collection.insert_one(doc)
        doc["_id"] = result.inserted_id
        return doc

    async def get_by_id(self, lead_id: str) -> dict[str, Any] | None:
        return await self._collection.find_one({"_id": ObjectId(lead_id)})

    async def list(
        self, page: int, page_size: int, status: str | None = None
    ) -> tuple[list[dict[str, Any]], int]:
        query = {"status": status} if status else {}
        total = await self._collection.count_documents(query)
        cursor = (
            self._collection.find(query)
            .sort("createdAt", -1)
            .skip((page - 1) * page_size)
            .limit(page_size)
        )
        items = [doc async for doc in cursor]
        return items, total

    async def update_status(self, lead_id: str, status: str) -> dict[str, Any] | None:
        await self._collection.update_one(
            {"_id": ObjectId(lead_id)},
            {"$set": {"status": status, "updatedAt": datetime.now(UTC)}},
        )
        return await self.get_by_id(lead_id)

    async def assign(self, lead_id: str, user_id: str | None) -> dict[str, Any] | None:
        await self._collection.update_one(
            {"_id": ObjectId(lead_id)},
            {"$set": {"assignedTo": user_id, "updatedAt": datetime.now(UTC)}},
        )
        return await self.get_by_id(lead_id)

    async def counts_by_status(self) -> dict[str, int]:
        return {
            status: await self._collection.count_documents({"status": status})
            for status in LEAD_STATUSES
        }


class LeadNotesRepository:
    def __init__(self, db: AsyncIOMotorDatabase):
        self._collection = db["lead_notes"]

    async def add(self, lead_id: str, author_id: str, body: str) -> dict[str, Any]:
        doc = {
            "leadId": lead_id,
            "authorId": author_id,
            "body": body,
            "createdAt": datetime.now(UTC),
        }
        result = await self._collection.insert_one(doc)
        doc["_id"] = result.inserted_id
        return doc

    async def list_for_lead(self, lead_id: str) -> list[dict[str, Any]]:
        cursor = self._collection.find({"leadId": lead_id}).sort("createdAt", 1)
        return [doc async for doc in cursor]
