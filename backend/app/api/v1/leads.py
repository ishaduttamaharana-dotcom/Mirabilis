from typing import Any

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel

from app.core.db import get_db
from app.core.rbac import CurrentUser, require_editor, require_viewer
from app.repositories.leads import LeadNotesRepository, LeadsRepository
from app.repositories.notifications import NotificationsRepository
from app.services.leads_service import LeadsService
from app.utils.envelope import data, paginated

router = APIRouter(prefix="/admin/leads", tags=["admin:leads"])


class StatusUpdate(BaseModel):
    status: str


class AssignUpdate(BaseModel):
    userId: str | None = None


class NoteCreate(BaseModel):
    body: str


def _service() -> LeadsService:
    db = get_db()
    return LeadsService(LeadsRepository(db), LeadNotesRepository(db), NotificationsRepository(db))


def _serialize(doc: dict[str, Any]) -> dict[str, Any]:
    out = dict(doc)
    out["id"] = str(out.pop("_id"))
    return out


@router.get("")
async def list_leads(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    status: str | None = None,
    _: CurrentUser = Depends(require_viewer),
):
    items, total = await _service().list(page, page_size, status)
    return paginated([_serialize(i) for i in items], page, page_size, total)


@router.get("/kpis")
async def lead_kpis(_: CurrentUser = Depends(require_viewer)):
    return data(await _service().kpis())


@router.get("/{lead_id}")
async def get_lead(lead_id: str, _: CurrentUser = Depends(require_viewer)):
    lead = await _service().get(lead_id)
    notes = await _service().notes(lead_id)
    return data({**_serialize(lead), "notes": [_serialize(n) for n in notes]})


@router.put("/{lead_id}/status")
async def update_status(lead_id: str, body: StatusUpdate, _: CurrentUser = Depends(require_editor)):
    lead = await _service().update_status(lead_id, body.status)
    return data(_serialize(lead))


@router.put("/{lead_id}/assign")
async def assign_lead(lead_id: str, body: AssignUpdate, _: CurrentUser = Depends(require_editor)):
    lead = await _service().assign(lead_id, body.userId)
    return data(_serialize(lead))


@router.post("/{lead_id}/notes")
async def add_note(lead_id: str, body: NoteCreate, user: CurrentUser = Depends(require_editor)):
    note = await _service().add_note(lead_id, user.user_id, body.body)
    return data(_serialize(note))
