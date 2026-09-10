from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field

from app.core.rbac import Role


class UserInDB(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    id: str = Field(alias="_id")
    email: EmailStr
    password_hash: str = Field(alias="passwordHash")
    role: Role
    must_change_password: bool = Field(default=False, alias="mustChangePassword")
    active: bool = True
    created_at: datetime = Field(alias="createdAt")
    updated_at: datetime = Field(alias="updatedAt")


class UserPublic(BaseModel):
    """Never includes password_hash — this is what the API returns."""

    model_config = ConfigDict(populate_by_name=True)

    id: str
    email: EmailStr
    role: Role
    must_change_password: bool = Field(alias="mustChangePassword")
    active: bool


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class LoginResponse(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    access_token: str = Field(alias="accessToken")
    user: UserPublic
