from fastapi import APIRouter, Depends, Request, Response
from pydantic import BaseModel, EmailStr, Field

from app.core.config import get_settings
from app.core.db import get_db
from app.core.rate_limit import rate_limit
from app.core.rbac import CurrentUser, get_current_user
from app.models.user import LoginRequest, LoginResponse, UserPublic
from app.repositories.password_reset_tokens import PasswordResetTokensRepository
from app.repositories.refresh_tokens import RefreshTokensRepository
from app.repositories.users import UsersRepository
from app.services.auth_service import AuthService
from app.utils.envelope import ApiError, data

router = APIRouter(prefix="/auth", tags=["auth"])

REFRESH_COOKIE_NAME = "mirabilis_refresh"


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str = Field(min_length=10, alias="newPassword")


class ChangePasswordRequest(BaseModel):
    current_password: str = Field(alias="currentPassword")
    new_password: str = Field(min_length=10, alias="newPassword")


def get_auth_service() -> AuthService:
    db = get_db()
    return AuthService(
        UsersRepository(db), RefreshTokensRepository(db), PasswordResetTokensRepository(db)
    )


_login_rate_limit = Depends(rate_limit("login", get_settings().rate_limit_login_per_minute))


@router.post("/login", dependencies=[_login_rate_limit])
async def login(
    body: LoginRequest,
    response: Response,
    auth_service: AuthService = Depends(get_auth_service),
):
    access_token, refresh_plaintext, user = await auth_service.login(body.email, body.password)

    # HttpOnly + Secure + SameSite cookie — never readable by client JS.
    response.set_cookie(
        key=REFRESH_COOKIE_NAME,
        value=refresh_plaintext,
        httponly=True,
        secure=True,
        samesite="lax",
        max_age=60 * 60 * 24 * 30,
        path="/api/v1/auth",
    )

    payload = LoginResponse(
        access_token=access_token,
        user=UserPublic(
            id=str(user["_id"]),
            email=user["email"],
            role=user["role"],
            must_change_password=user["mustChangePassword"],
            active=user["active"],
        ),
    )
    return data(payload.model_dump(by_alias=True))


@router.post("/refresh")
async def refresh(
    request: Request,
    response: Response,
    auth_service: AuthService = Depends(get_auth_service),
):
    token = request.cookies.get(REFRESH_COOKIE_NAME)
    if not token:
        raise ApiError(401, "UNAUTHORIZED", "No refresh token present")

    access_token, new_plaintext = await auth_service.refresh(token)
    response.set_cookie(
        key=REFRESH_COOKIE_NAME,
        value=new_plaintext,
        httponly=True,
        secure=True,
        samesite="lax",
        max_age=60 * 60 * 24 * 30,
        path="/api/v1/auth",
    )
    return data({"accessToken": access_token})


@router.post("/logout")
async def logout(
    request: Request,
    response: Response,
    auth_service: AuthService = Depends(get_auth_service),
):
    token = request.cookies.get(REFRESH_COOKIE_NAME)
    if token:
        await auth_service.logout(token)
    response.delete_cookie(REFRESH_COOKIE_NAME, path="/api/v1/auth")
    return data({"loggedOut": True})


@router.post(
    "/forgot-password",
    dependencies=[Depends(rate_limit("forgot-password", get_settings().rate_limit_login_per_minute))],
)
async def forgot_password(
    body: ForgotPasswordRequest, auth_service: AuthService = Depends(get_auth_service)
):
    token = await auth_service.request_password_reset(body.email)
    if token is not None:
        reset_url = f"{get_settings().frontend_base_url}/admin/reset-password?token={token}"
        print(f"[AUTH RESET] Password reset token generated for email: {body.email}. Link: {reset_url}")
    else:
        print(f"[AUTH RESET] Password reset requested for non-existent or inactive email: {body.email}")
    return data({"sent": True})


@router.post(
    "/reset-password",
    dependencies=[Depends(rate_limit("reset-password", get_settings().rate_limit_login_per_minute))],
)
async def reset_password(
    body: ResetPasswordRequest, auth_service: AuthService = Depends(get_auth_service)
):
    await auth_service.confirm_password_reset(body.token, body.new_password)
    return data({"reset": True})


@router.get("/me")
async def me(
    user: CurrentUser = Depends(get_current_user),
    auth_service: AuthService = Depends(get_auth_service),
):
    db_user = await UsersRepository(get_db()).find_by_id(user.user_id)
    if db_user is None:
        raise ApiError(404, "NOT_FOUND", "User not found")
    payload = UserPublic(
        id=str(db_user["_id"]),
        email=db_user["email"],
        role=db_user["role"],
        must_change_password=db_user["mustChangePassword"],
        active=db_user["active"],
    )
    return data(payload.model_dump(by_alias=True))


@router.post("/change-password")
async def change_password(
    body: ChangePasswordRequest,
    user: CurrentUser = Depends(get_current_user),
    auth_service: AuthService = Depends(get_auth_service),
):
    await auth_service.change_password(user.user_id, body.current_password, body.new_password)
    return data({"changed": True})
