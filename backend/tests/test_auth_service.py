import pytest

from app.core.security import hash_password, verify_password
from app.services.auth_service import AuthService
from app.utils.envelope import ApiError


class FakeUsersRepo:
    def __init__(self, user=None):
        self._user = user
        self.users = {}
        if user:
            self.users[user["email"]] = user
            self.users[user["_id"]] = user

    async def find_by_email(self, email):
        return self.users.get(email)

    async def find_by_id(self, user_id):
        return self.users.get(user_id)

    async def update_password(self, user_id, password_hash):
        if user_id in self.users:
            self.users[user_id]["passwordHash"] = password_hash
            self.users[user_id]["mustChangePassword"] = False


class FakeRefreshTokensRepo:
    def __init__(self):
        self.tokens = []

    async def create(self, user_id, token_hash, expires_at, family):
        self.tokens.append({
            "userId": user_id,
            "tokenHash": token_hash,
            "expiresAt": expires_at,
            "family": family,
            "revoked": False,
        })


class FakePasswordResetsRepo:
    def __init__(self):
        self.records = {}

    async def create(self, user_id, token_hash, expires_at):
        self.records[token_hash] = {
            "userId": user_id,
            "tokenHash": token_hash,
            "expiresAt": expires_at,
            "used": False,
        }

    async def find_valid(self, token_hash):
        rec = self.records.get(token_hash)
        if rec and not rec.get("used", False):
            return rec
        return None

    async def mark_used(self, token_hash):
        if token_hash in self.records:
            self.records[token_hash]["used"] = True


def make_service():
    user = {
        "_id": "u1",
        "email": "admin@example.com",
        "passwordHash": hash_password("OldPassword123!"),
        "role": "super_admin",
        "active": True,
        "mustChangePassword": True,
    }
    users_repo = FakeUsersRepo(user)
    refresh_repo = FakeRefreshTokensRepo()
    resets_repo = FakePasswordResetsRepo()
    return AuthService(users_repo, refresh_repo, resets_repo), user, users_repo, resets_repo


@pytest.mark.asyncio
async def test_login_success_returns_token_and_user():
    service, user, _, _ = make_service()
    access_token, refresh_token, user_doc = await service.login("admin@example.com", "OldPassword123!")
    assert isinstance(access_token, str)
    assert isinstance(refresh_token, str)
    assert user_doc["email"] == "admin@example.com"


@pytest.mark.asyncio
async def test_login_rejects_incorrect_password():
    service, _, _, _ = make_service()
    with pytest.raises(ApiError) as exc_info:
        await service.login("admin@example.com", "WrongPassword123!")
    assert exc_info.value.status_code == 401
    assert exc_info.value.code == "UNAUTHORIZED"


@pytest.mark.asyncio
async def test_login_rejects_nonexistent_account():
    service, _, _, _ = make_service()
    with pytest.raises(ApiError) as exc_info:
        await service.login("nonexistent@example.com", "OldPassword123!")
    assert exc_info.value.status_code == 401
    assert exc_info.value.code == "UNAUTHORIZED"


@pytest.mark.asyncio
async def test_login_rejects_inactive_account():
    service, user, _, _ = make_service()
    user["active"] = False
    with pytest.raises(ApiError) as exc_info:
        await service.login("admin@example.com", "OldPassword123!")
    assert exc_info.value.status_code == 401


@pytest.mark.asyncio
async def test_password_reset_flow():
    service, user, users_repo, resets_repo = make_service()
    # 1. Request reset token
    token = await service.request_password_reset("admin@example.com")
    assert token is not None
    assert isinstance(token, str)

    # 2. Non-existent account returns None (no email enumeration)
    non_existent_token = await service.request_password_reset("nobody@example.com")
    assert non_existent_token is None

    # 3. Confirm password reset
    new_password = "BrandNewPassword123!"
    await service.confirm_password_reset(token, new_password)
    assert verify_password(new_password, user["passwordHash"])
    assert user["mustChangePassword"] is False

    # 4. Attempting to reuse reset token raises ApiError
    with pytest.raises(ApiError) as exc_info:
        await service.confirm_password_reset(token, "AnotherPassword123!")
    assert exc_info.value.code == "INVALID_TOKEN"


@pytest.mark.asyncio
async def test_change_password_requires_correct_current_password():
    service, _, _, _ = make_service()
    with pytest.raises(ApiError) as exc_info:
        await service.change_password("u1", "WrongPassword", "NewPassword123!")
    assert exc_info.value.code == "INVALID_PASSWORD"


@pytest.mark.asyncio
async def test_change_password_updates_hash_and_clears_flag():
    service, user, _, _ = make_service()
    await service.change_password("u1", "OldPassword123!", "NewPassword123!")
    assert verify_password("NewPassword123!", user["passwordHash"])
    assert user["mustChangePassword"] is False


@pytest.mark.asyncio
async def test_change_password_rejects_inactive_account():
    service, user, _, _ = make_service()
    user["active"] = False
    with pytest.raises(ApiError) as exc_info:
        await service.change_password("u1", "OldPassword123!", "NewPassword123!")
    assert exc_info.value.status_code == 401
