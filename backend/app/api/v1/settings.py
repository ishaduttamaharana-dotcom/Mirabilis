from typing import Any

from fastapi import APIRouter, Depends

from app.core.db import get_db
from app.core.rbac import CurrentUser, require_editor, require_super_admin, require_viewer
from app.repositories.site_settings import SiteSettingsRepository
from app.services.site_settings_service import SiteSettingsService
from app.utils.envelope import ApiError, data

router = APIRouter(prefix="/admin/settings", tags=["admin:settings"])


def _service() -> SiteSettingsService:
    return SiteSettingsService(SiteSettingsRepository(get_db()))


@router.get("")
async def get_settings(_: CurrentUser = Depends(require_viewer)):
    return data(await _service().get())


@router.put("")
async def update_settings(payload: dict[str, Any], user: CurrentUser = Depends(require_editor)):
    return data(await _service().update(payload, user.user_id))


from app.services.email_service import EmailService


@router.post("/test-email")
async def test_email(user: CurrentUser = Depends(require_super_admin)):
    settings = await _service().get()
    if not settings.get("smtpPasswordConfigured") and not settings.get("smtpHost"):
        raise ApiError(400, "SMTP_NOT_CONFIGURED", "Set SMTP host and password before testing")

    try:
        email_svc = EmailService(settings)
        await email_svc.send_email(
            to_email=user.email,
            subject="[Mirabilis] Test Email Verification",
            body="This is a test email sent from your Mirabilis Admin Settings configuration. Your SMTP setup is working correctly!",
        )
        return data({"sent": True, "message": f"Test email sent to {user.email}"})
    except Exception as err:
        raise ApiError(500, "EMAIL_SEND_FAILED", f"SMTP delivery failed: {err}")

