import uuid
from datetime import UTC, datetime, timedelta
from typing import Any

from app.core.security import (
    create_access_token,
    generate_refresh_token,
    hash_opaque_token,
    hash_password,
    refresh_token_expiry,
    verify_password,
)
from app.repositories.password_reset_tokens import PasswordResetTokensRepository
from app.repositories.refresh_tokens import RefreshTokensRepository
from app.repositories.users import UsersRepository
from app.utils.envelope import ApiError

PASSWORD_RESET_TTL_MINUTES = 30


class AuthService:
    def __init__(
        self,
        users: UsersRepository,
        refresh_tokens: RefreshTokensRepository,
        password_resets: PasswordResetTokensRepository | None = None,
    ):
        self._users = users
        self._refresh_tokens = refresh_tokens
        self._password_resets = password_resets

    async def login(self, email: str, password: str) -> tuple[str, str, dict[str, Any]]:
        user = await self._users.find_by_email(email)
        if not user:
            print(f"[AUTH FAIL] Nonexistent account login attempt for email: {email}")
            raise ApiError(401, "UNAUTHORIZED", "Invalid email or password")
        if not user.get("active", True):
            print(f"[AUTH FAIL] Inactive account login attempt for email: {email}")
            raise ApiError(401, "UNAUTHORIZED", "Account is inactive")
        if not verify_password(password, user["passwordHash"]):
            print(f"[AUTH FAIL] Incorrect password login attempt for email: {email}")
            raise ApiError(401, "UNAUTHORIZED", "Invalid email or password")

        access_token = create_access_token(subject=str(user["_id"]), role=user["role"])
        refresh_plaintext, refresh_hash = generate_refresh_token()
        family = str(uuid.uuid4())
        await self._refresh_tokens.create(
            user_id=str(user["_id"]),
            token_hash=refresh_hash,
            expires_at=refresh_token_expiry(),
            family=family,
        )
        print(f"[AUTH SUCCESS] Successful login for email: {email} (User ID: {user['_id']})")
        return access_token, refresh_plaintext, user

    async def refresh(self, refresh_plaintext: str) -> tuple[str, str]:
        """Rotates the refresh token. Reuse of an already-revoked token
        revokes the entire family (replay detection, security.md)."""
        token_hash = hash_opaque_token(refresh_plaintext)
        record = await self._refresh_tokens.find_by_hash(token_hash)
        if record is None:
            raise ApiError(401, "UNAUTHORIZED", "Invalid refresh token")
        if record["revoked"]:
            await self._refresh_tokens.revoke_family(record["family"])
            raise ApiError(401, "UNAUTHORIZED", "Refresh token reuse detected — session revoked")

        await self._refresh_tokens.revoke(token_hash)

        user = await self._users.find_by_id(record["userId"])
        if user is None or not user.get("active", True):
            raise ApiError(401, "UNAUTHORIZED", "Account no longer active")

        access_token = create_access_token(subject=str(user["_id"]), role=user["role"])
        new_plaintext, new_hash = generate_refresh_token()
        await self._refresh_tokens.create(
            user_id=str(user["_id"]),
            token_hash=new_hash,
            expires_at=refresh_token_expiry(),
            family=record["family"],
        )
        return access_token, new_plaintext

    async def logout(self, refresh_plaintext: str) -> None:
        await self._refresh_tokens.revoke(hash_opaque_token(refresh_plaintext))

    async def request_password_reset(self, email: str) -> str | None:
        """Returns the plaintext reset token to be emailed, or None if the
        email doesn't match an account. Callers must respond identically
        either way (no email-enumeration via response differences —
        security.md)."""
        assert self._password_resets is not None
        user = await self._users.find_by_email(email)
        if user is None or not user.get("active", True):
            return None
        plaintext = uuid.uuid4().hex + uuid.uuid4().hex
        token_hash = hash_opaque_token(plaintext)
        expires_at = datetime.now(UTC) + timedelta(minutes=PASSWORD_RESET_TTL_MINUTES)
        await self._password_resets.create(str(user["_id"]), token_hash, expires_at)
        return plaintext

    async def confirm_password_reset(self, token_plaintext: str, new_password: str) -> None:
        assert self._password_resets is not None
        token_hash = hash_opaque_token(token_plaintext)
        record = await self._password_resets.find_valid(token_hash)
        if record is None:
            raise ApiError(400, "INVALID_TOKEN", "Reset link is invalid or has expired")
        await self._users.update_password(record["userId"], hash_password(new_password))
        await self._password_resets.mark_used(token_hash)
        # Revoking active sessions on password reset is a further hardening
        # step (Phase 9) — needs a users->refresh_tokens revoke-all-by-user
        # helper; see docs/tracker.md.

    async def change_password(self, user_id: str, current_password: str, new_password: str) -> None:
        """Authenticated self-service password change — this is what
        clears `mustChangePassword` after the forced first login (rules.md:
        "on first login, force a password change")."""
        user = await self._users.find_by_id(user_id)
        if user is None or not user.get("active", True):
            raise ApiError(401, "UNAUTHORIZED", "Account no longer active")
        if not verify_password(current_password, user["passwordHash"]):
            raise ApiError(400, "INVALID_PASSWORD", "Current password is incorrect")
        await self._users.update_password(user_id, hash_password(new_password))
