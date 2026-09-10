from enum import StrEnum

from fastapi import Depends, HTTPException, Request, status

from app.core.security import decode_access_token


class Role(StrEnum):
    SUPER_ADMIN = "super_admin"
    EDITOR = "editor"
    VIEWER = "viewer"


ROLE_RANK = {Role.VIEWER: 0, Role.EDITOR: 1, Role.SUPER_ADMIN: 2}


class CurrentUser:
    def __init__(self, user_id: str, role: Role):
        self.user_id = user_id
        self.role = role


def get_current_user(request: Request) -> CurrentUser:
    auth_header = request.headers.get("Authorization", "")
    if not auth_header.startswith("Bearer "):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Missing bearer token")
    token = auth_header.removeprefix("Bearer ").strip()
    try:
        payload = decode_access_token(token)
    except Exception as exc:  # jwt raises several subclasses; all mean "invalid"
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid or expired token") from exc
    try:
        role = Role(payload["role"])
    except ValueError as exc:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid role claim") from exc
    return CurrentUser(user_id=payload["sub"], role=role)


def require_role(minimum: Role):
    """Dependency factory: require the caller's role to be >= `minimum`.

    RBAC is enforced here, server-side, on every admin-scoped route — never
    only hidden in the UI (see security.md).
    """

    def dependency(user: CurrentUser = Depends(get_current_user)) -> CurrentUser:
        if ROLE_RANK[user.role] < ROLE_RANK[minimum]:
            raise HTTPException(status.HTTP_403_FORBIDDEN, "Insufficient permissions")
        return user

    return dependency


require_viewer = require_role(Role.VIEWER)
require_editor = require_role(Role.EDITOR)
require_super_admin = require_role(Role.SUPER_ADMIN)
