from __future__ import annotations

from typing import Any, List  # noqa: UP035 (List kept to dodge a mypy / "list" method-name collision)

from app.repositories.leads import LEAD_STATUSES, LeadNotesRepository, LeadsRepository
from app.repositories.notifications import NotificationsRepository
from app.utils.envelope import ApiError


class LeadsService:
    def __init__(
        self,
        leads: LeadsRepository,
        notes: LeadNotesRepository,
        notifications: NotificationsRepository,
    ):
        self._leads = leads
        self._notes = notes
        self._notifications = notifications

    async def submit_contact_form(self, payload: dict[str, Any]) -> dict[str, Any]:
        if not payload.get("name") or not payload.get("email") or not payload.get("message"):
            raise ApiError(422, "VALIDATION_ERROR", "name, email, and message are required")
        lead = await self._leads.create(payload)
        await self._notifications.create(
            notif_type="new_lead",
            message=f"New lead from {lead['name']}",
            entity_ref=str(lead["_id"]),
        )
        return lead

    async def list(self, page: int, page_size: int, status: str | None = None):
        return await self._leads.list(page, page_size, status)

    async def get(self, lead_id: str) -> dict[str, Any]:
        lead = await self._leads.get_by_id(lead_id)
        if lead is None:
            raise ApiError(404, "NOT_FOUND", "Lead not found")
        return lead

    async def update_status(self, lead_id: str, status: str) -> dict[str, Any]:
        if status not in LEAD_STATUSES:
            raise ApiError(422, "VALIDATION_ERROR", f"status must be one of {LEAD_STATUSES}")
        await self.get(lead_id)
        doc = await self._leads.update_status(lead_id, status)
        assert doc is not None
        return doc

    async def assign(self, lead_id: str, user_id: str | None) -> dict[str, Any]:
        await self.get(lead_id)
        doc = await self._leads.assign(lead_id, user_id)
        assert doc is not None
        return doc

    async def add_note(self, lead_id: str, author_id: str, body: str) -> dict[str, Any]:
        await self.get(lead_id)
        return await self._notes.add(lead_id, author_id, body)

    async def notes(self, lead_id: str) -> List[dict[str, Any]]:  # noqa: UP006 (mypy: see "list" method name collision above)
        return await self._notes.list_for_lead(lead_id)

    async def kpis(self) -> dict[str, Any]:
        counts = await self._leads.counts_by_status()
        return {"byStatus": counts, "newLeads": counts.get("new", 0)}
