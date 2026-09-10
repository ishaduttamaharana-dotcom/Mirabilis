from datetime import UTC, datetime
from typing import Any

from motor.motor_asyncio import AsyncIOMotorDatabase


class UsersRepository:
    def __init__(self, db: AsyncIOMotorDatabase):
        self._collection = db["users"]

    async def find_by_email(self, email: str) -> dict[str, Any] | None:
        return await self._collection.find_one({"email": email})

    async def find_by_id(self, user_id: str) -> dict[str, Any] | None:
        from bson import ObjectId

        return await self._collection.find_one({"_id": ObjectId(user_id)})

    async def create(
        self, email: str, password_hash: str, role: str, must_change_password: bool
    ) -> dict[str, Any]:
        now = datetime.now(UTC)
        doc = {
            "email": email,
            "passwordHash": password_hash,
            "role": role,
            "mustChangePassword": must_change_password,
            "active": True,
            "createdAt": now,
            "updatedAt": now,
        }
        result = await self._collection.insert_one(doc)
        doc["_id"] = result.inserted_id
        return doc

    async def count(self) -> int:
        return await self._collection.count_documents({})

    async def update_password(self, user_id: str, password_hash: str) -> None:
        from bson import ObjectId

        await self._collection.update_one(
            {"_id": ObjectId(user_id)},
            {
                "$set": {
                    "passwordHash": password_hash,
                    "mustChangePassword": False,
                    "updatedAt": datetime.now(UTC),
                }
            },
        )
