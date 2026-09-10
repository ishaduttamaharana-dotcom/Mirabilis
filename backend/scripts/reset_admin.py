import asyncio
from datetime import datetime, timezone
from app.core.config import get_settings
from app.core.db import get_db, ensure_indexes
from app.core.security import hash_password

async def reset_admin() -> None:
    print("[INFO] Connecting to MongoDB and performing strict admin reset...")
    await ensure_indexes()
    db = get_db()
    
    # Clean out all old sessions & tokens
    await db["refresh_tokens"].delete_many({})
    await db["password_reset_tokens"].delete_many({})
    
    # Strictly delete ALL other user accounts
    target_email = "admin@mirabilis.com"
    password = "MirabilisBYT@2026"
    pwd_hash = hash_password(password)
    now = datetime.now(timezone.utc)

    # Remove any non-target users
    delete_result = await db["users"].delete_many({"email": {"$ne": target_email}})
    print(f"[OK] Deleted {delete_result.deleted_count} non-admin user accounts.")

    # Reset or create the single clean admin account
    existing = await db["users"].find_one({"email": target_email})
    if existing:
        await db["users"].update_one(
            {"_id": existing["_id"]},
            {
                "$set": {
                    "email": target_email,
                    "passwordHash": pwd_hash,
                    "mustChangePassword": False,
                    "active": True,
                    "role": "super_admin",
                    "updatedAt": now,
                }
            }
        )
        print(f"[OK] Reset password for single admin account: {target_email}")
    else:
        await db["users"].insert_one({
            "email": target_email,
            "passwordHash": pwd_hash,
            "role": "super_admin",
            "mustChangePassword": False,
            "active": True,
            "createdAt": now,
            "updatedAt": now,
        })
        print(f"[OK] Created single admin user: {target_email}")

    print("\n--------------------------------------------------")
    print("STRICT ADMIN RESET COMPLETE!")
    print(f"Email:    {target_email}")
    print(f"Password: {password}")
    print("--------------------------------------------------")

if __name__ == "__main__":
    asyncio.run(reset_admin())
