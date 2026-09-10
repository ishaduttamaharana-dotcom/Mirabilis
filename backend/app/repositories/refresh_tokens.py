from datetime import UTC, datetime
from typing import Any

from motor.motor_asyncio import AsyncIOMotorDatabase


class RefreshTokensRepository:
    def __init__(self, db: AsyncIOMotorDatabase):
        self._collection = db["refresh_tokens"]

    async def create(
        self, user_id: str, token_hash: str, expires_at: datetime, family: str
    ) -> dict[str, Any]:
        doc = {
            "userId": user_id,
            "tokenHash": token_hash,
            "family": family,
            "expiresAt": expires_at,
            "revoked": False,
            "createdAt": datetime.now(UTC),
        }
        result = await self._collection.insert_one(doc)
        doc["_id"] = result.inserted_id
        return doc

    async def find_by_hash(self, token_hash: str) -> dict[str, Any] | None:
        return await self._collection.find_one({"tokenHash": token_hash})

    async def revoke(self, token_hash: str) -> None:
        await self._collection.update_one({"tokenHash": token_hash}, {"$set": {"revoked": True}})

    async def revoke_family(self, family: str) -> None:
        """Replay detection: if a revoked/rotated token is reused, kill the
        whole token family (security.md — refresh token rotation)."""
        await self._collection.update_many({"family": family}, {"$set": {"revoked": True}})
