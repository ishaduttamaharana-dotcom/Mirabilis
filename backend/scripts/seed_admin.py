import asyncio
import sys
from app.core.config import get_settings
from app.core.db import get_db, ensure_indexes
from app.core.security import hash_password
from app.repositories.users import UsersRepository
from app.repositories.refresh_tokens import RefreshTokensRepository
from app.repositories.password_reset_tokens import PasswordResetTokensRepository
from app.services.auth_service import AuthService

async def seed_admin():
    print("[INFO] Connecting to MongoDB and ensuring indexes...")
    await ensure_indexes()
    db = get_db()
    settings = get_settings()

    email = settings.seed_admin_email
    password = settings.seed_admin_password

    print(f"[INFO] Seeding Admin Account: {email}")

    users_repo = UsersRepository(db)
    existing = await users_repo.find_by_email(email)

    if existing:
        await users_repo._collection.update_one(
            {"email": email},
            {
                "$set": {
                    "passwordHash": hash_password(password),
                    "role": "super_admin",
                    "active": True,
                    "mustChangePassword": False,
                }
            },
        )
        print(f"[OK] Existing admin '{email}' updated with configured password.")
    else:
        await users_repo.create(
            email=email,
            password_hash=hash_password(password),
            role="super_admin",
            must_change_password=False,
        )
        print(f"[OK] New Super Admin '{email}' created.")

    # Test & verify auth login logic directly
    auth_service = AuthService(
        users_repo,
        RefreshTokensRepository(db),
        PasswordResetTokensRepository(db),
    )

    try:
        token, _, user_doc = await auth_service.login(email, password)
        print("--------------------------------------------------")
        print("[SUCCESS] ADMIN ACCOUNT SEEDED & VERIFIED SUCCESSFULLY!")
        print(f"  Email:    {email}")
        print(f"  Password: {password}")
        print(f"  Role:     {user_doc['role']}")
        print(f"  User ID:  {user_doc['_id']}")
        print("--------------------------------------------------")
    except Exception as err:
        print(f"[ERROR] Verification login failed: {err}")
        sys.exit(1)

if __name__ == "__main__":
    asyncio.run(seed_admin())
