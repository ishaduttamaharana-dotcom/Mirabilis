import pytest

from app.repositories.leads import LEAD_STATUSES
from app.services.leads_service import LeadsService
from app.utils.envelope import ApiError


class FakeLeadsRepo:
    def __init__(self):
        self._docs = {}
        self._next = 1

    async def create(self, payload):
        item_id = str(self._next)
        self._next += 1
        doc = {"_id": item_id, "status": "new", **payload}
        self._docs[item_id] = doc
        return doc

    async def get_by_id(self, lead_id):
        return self._docs.get(lead_id)

    async def update_status(self, lead_id, status):
        self._docs[lead_id]["status"] = status
        return self._docs[lead_id]

    async def assign(self, lead_id, user_id):
        self._docs[lead_id]["assignedTo"] = user_id
        return self._docs[lead_id]

    async def counts_by_status(self):
        counts = dict.fromkeys(LEAD_STATUSES, 0)
        for doc in self._docs.values():
            counts[doc["status"]] += 1
        return counts

    async def list(self, page, page_size, status=None):
        items = [d for d in self._docs.values() if status is None or d["status"] == status]
        return items, len(items)


class FakeNotesRepo:
    def __init__(self):
        self._notes = []

    async def add(self, lead_id, author_id, body):
        note = {"_id": str(len(self._notes)), "leadId": lead_id, "authorId": author_id, "body": body}
        self._notes.append(note)
        return note

    async def list_for_lead(self, lead_id):
        return [n for n in self._notes if n["leadId"] == lead_id]


class FakeNotificationsRepo:
    def __init__(self):
        self.created = []

    async def create(self, notif_type, message, entity_ref, user_id=None):
        self.created.append((notif_type, message, entity_ref))


def make_service():
    leads = FakeLeadsRepo()
    notifications = FakeNotificationsRepo()
    return LeadsService(leads, FakeNotesRepo(), notifications), notifications


@pytest.mark.asyncio
async def test_submit_contact_form_requires_name_email_message():
    service, _ = make_service()
    with pytest.raises(ApiError) as exc_info:
        await service.submit_contact_form({"name": "Isha"})
    assert exc_info.value.status_code == 422


@pytest.mark.asyncio
async def test_submit_contact_form_creates_lead_and_notification():
    service, notifications = make_service()
    lead = await service.submit_contact_form(
        {"name": "Isha", "email": "isha@example.com", "message": "Interested in a shoot"}
    )
    assert lead["status"] == "new"
    assert len(notifications.created) == 1
    assert notifications.created[0][0] == "new_lead"


@pytest.mark.asyncio
async def test_update_status_rejects_unknown_status():
    service, _ = make_service()
    lead = await service.submit_contact_form(
        {"name": "Isha", "email": "isha@example.com", "message": "hi"}
    )
    with pytest.raises(ApiError):
        await service.update_status(lead["_id"], "not-a-real-status")


@pytest.mark.asyncio
async def test_update_status_missing_lead_is_404():
    service, _ = make_service()
    with pytest.raises(ApiError) as exc_info:
        await service.update_status("missing", "won")
    assert exc_info.value.status_code == 404


@pytest.mark.asyncio
async def test_add_note_and_kpis():
    service, _ = make_service()
    lead = await service.submit_contact_form(
        {"name": "Isha", "email": "isha@example.com", "message": "hi"}
    )
    await service.add_note(lead["_id"], "admin-1", "Called, left voicemail")
    notes = await service.notes(lead["_id"])
    assert len(notes) == 1
    assert notes[0]["body"] == "Called, left voicemail"

    kpis = await service.kpis()
    assert kpis["newLeads"] == 1
