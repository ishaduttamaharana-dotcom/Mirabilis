import pytest
from fastapi import HTTPException

from app.core.rbac import CurrentUser, Role, require_role


def test_viewer_denied_editor_route():
    check = require_role(Role.EDITOR)
    viewer = CurrentUser(user_id="u1", role=Role.VIEWER)
    with pytest.raises(HTTPException) as exc_info:
        check(user=viewer)
    assert exc_info.value.status_code == 403


def test_super_admin_allowed_editor_route():
    from app.core.rbac import require_role

    check = require_role(Role.EDITOR)
    admin = CurrentUser(user_id="u1", role=Role.SUPER_ADMIN)
    result = check(user=admin)
    assert result is admin
