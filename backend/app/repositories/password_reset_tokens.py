from datetime import UTC, datetime
from typing import Any

from motor.motor_asyncio import AsyncIOMotorDatabase


class PasswordResetTokensRepository:
    def __init__(self, db: AsyncIOMotorDatabase):
        self._collection = db["password_reset_tokens"]

    async def create(self, user_id: str, token_hash: str, expires_at: datetime) -> dict[str, Any]:
        doc = {
            "userId": user_id,
            "tokenHash": token_hash,
            "expiresAt": expires_at,
            "usedAt": None,
            "createdAt": datetime.now(UTC),
        }
        result = await self._collection.insert_one(doc)
        doc["_id"] = result.inserted_id
        return doc

    async def find_valid(self, token_hash: str) -> dict[str, Any] | None:
        return await self._collection.find_one(
            {
                "tokenHash": token_hash,
                "usedAt": None,
                "expiresAt": {"$gt": datetime.now(UTC)},
            }
        )

    async def mark_used(self, token_hash: str) -> None:
        await self._collection.update_one(
            {"tokenHash": token_hash}, {"$set": {"usedAt": datetime.now(UTC)}}
        )

    async def invalidate_all_for_user(self, user_id: str) -> None:
        """Called after a successful reset so any other outstanding reset
        links for this user stop working."""
        await self._collection.update_many(
            {"userId": user_id, "usedAt": None},
            {"$set": {"usedAt": datetime.now(UTC)}},
        )
