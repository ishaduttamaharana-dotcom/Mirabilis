from fastapi import APIRouter, Depends, File, Form, UploadFile

from app.core.db import get_db
from app.core.rate_limit import rate_limit
from app.repositories.leads import LeadNotesRepository, LeadsRepository
from app.repositories.media import MediaRepository
from app.repositories.notifications import NotificationsRepository
from app.services.leads_service import LeadsService
from app.services.media_service import MediaService
from app.services.storage import get_storage_adapter
from app.utils.envelope import data

router = APIRouter(prefix="/public/contact", tags=["public:contact"])

_contact_rate_limit = Depends(rate_limit("contact", 3))


@router.post("", dependencies=[_contact_rate_limit])
async def submit_contact(
    name: str = Form(...),
    email: str = Form(...),
    message: str = Form(...),
    phone: str | None = Form(None),
    company: str | None = Form(None),
    location: str | None = Form(None),
    service_interest: str | None = Form(None),
    attachments: list[UploadFile] = File(default=[]),
):
    db = get_db()
    leads_service = LeadsService(
        LeadsRepository(db), LeadNotesRepository(db), NotificationsRepository(db)
    )
    media_service = MediaService(MediaRepository(db), get_storage_adapter())

    attachment_ids: list[str] = []
    for upload in attachments:
        if not upload.filename:
            continue
        content = await upload.read()
        media_doc = await media_service.upload(
            filename=upload.filename,
            declared_mime=upload.content_type or "",
            content=content,
            alt_text=f"Contact form attachment from {name}",
            uploaded_by="public",
        )
        media_id = str(media_doc["_id"])
        await media_service.reference(media_id)
        attachment_ids.append(media_id)

    lead = await leads_service.submit_contact_form(
        {
            "name": name,
            "email": email,
            "phone": phone,
            "company": company,
            "location": location,
            "serviceInterest": service_interest,
            "message": message,
            "attachments": attachment_ids,
            "source": "website",
        }
    )
    return data({"submitted": True, "leadId": str(lead["_id"])})
