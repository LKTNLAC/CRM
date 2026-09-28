from datetime import UTC, datetime
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.errors import ConflictError, NotFoundError
from app.core.tenant import TenantContext
from app.events.envelope import EventEnvelope
from app.events.outbox import OutboxEvent
from app.modules.leads.domain.events import LEAD_CONVERTED, LEAD_CREATED, LEAD_STATUS_CHANGED
from app.modules.leads.infrastructure.models import LeadModel
from app.modules.leads.infrastructure.repository import LeadRepository

VALID_STATUSES = {"NEW", "CONTACTED", "QUALIFIED", "CONSULTING", "TRIAL", "OFFER", "ENROLLED", "LOST"}


class LeadService:
    def __init__(self, session: AsyncSession, tenant: TenantContext):
        self.session = session
        self.tenant = tenant
        self.repo = LeadRepository(session, tenant)

    async def list(self, **filters):
        from app.core.scope import is_counselor_only
        # Nếu là counselor, force filter counselor_id = user_id
        if is_counselor_only(self.tenant.roles):
            filters["counselor_id"] = self.tenant.user_id
        return await self.repo.list(**filters)

    async def get(self, lead_id: UUID) -> LeadModel:
        lead = await self.repo.get(lead_id)
        if not lead:
            raise NotFoundError("Lead not found")
        return lead

    async def create(self, data: dict) -> LeadModel:
        data["organization_id"] = self.tenant.organization_id
        data["branch_id"] = self.tenant.branch_id
        data["created_by"] = self.tenant.user_id
        lead = await self.repo.create(**data)
        await self.repo.add_activity(
            lead_id=lead.id,
            activity_type="CREATED",
            content="Lead created",
            created_by=self.tenant.user_id,
        )
        await self._emit(LEAD_CREATED, lead)
        await self.session.commit()
        return lead

    async def update(self, lead_id: UUID, data: dict) -> LeadModel:
        lead = await self.get(lead_id)
        for k, v in data.items():
            if v is not None:
                setattr(lead, k, v)
        await self.session.commit()
        return lead

    async def change_status(self, lead_id: UUID, new_status: str, note: str | None = None, lost_reason: str | None = None) -> LeadModel:
        if new_status not in VALID_STATUSES:
            raise ConflictError(f"Invalid status: {new_status}")
        lead = await self.get(lead_id)
        old = lead.status
        if old == new_status:
            return lead
        if old == "ENROLLED":
            raise ConflictError("Cannot change status of ENROLLED lead")
        lead.status = new_status
        if new_status == "LOST" and lost_reason:
            lead.lost_reason = lost_reason
        await self.repo.add_activity(
            lead_id=lead.id,
            activity_type="STATUS_CHANGED",
            content=note,
            old_status=old,
            new_status=new_status,
            created_by=self.tenant.user_id,
        )
        await self._emit(LEAD_STATUS_CHANGED, lead, extra={"old_status": old, "new_status": new_status})
        await self.session.commit()
        return lead

    async def convert(self, lead_id: UUID, data: dict) -> dict:
        """Convert lead → student. Idempotent: nếu đã convert thì trả lại student cũ."""
        lead = await self.get(lead_id)

        if lead.status == "ENROLLED" and lead.converted_student_id:
            return {"student_id": str(lead.converted_student_id), "already_converted": True}

        if lead.status == "LOST":
            raise ConflictError("Cannot convert LOST lead")

        # Generate student_code nếu không có
        from app.modules.students.application.services import StudentService

        student_svc = StudentService(self.session, self.tenant)

        student_code = data.get("student_code")
        if not student_code:
            student_code = await student_svc.generate_student_code(self.tenant.organization_id)

        student = await student_svc.create_from_lead(
            organization_id=self.tenant.organization_id,
            branch_id=self.tenant.branch_id,
            student_code=student_code,
            full_name=lead.full_name,
            email=lead.email,
            phone=lead.phone,
            date_of_birth=data.get("date_of_birth"),
            gender=data.get("gender"),
            address=data.get("address"),
            source_lead_id=lead.id,
            counselor_id=lead.counselor_id,
            created_by=self.tenant.user_id,
        )

        # Create student
        from app.modules.students.infrastructure.models import StudentModel
        student = StudentModel(
            organization_id=self.tenant.organization_id,
            branch_id=self.tenant.branch_id,
            student_code=student_code,
            full_name=lead.full_name,
            email=lead.email,
            phone=lead.phone,
            date_of_birth=data.get("date_of_birth"),
            gender=data.get("gender"),
            address=data.get("address"),
            status="ACTIVE",
            source_lead_id=lead.id,
            counselor_id=lead.counselor_id,
            created_by=self.tenant.user_id,
        )
        self.session.add(student)
        await self.session.flush()

        # Update lead
        lead.status = "ENROLLED"
        lead.converted_student_id = student.id
        lead.converted_at = datetime.now(UTC)

        await self.repo.add_activity(
            lead_id=lead.id,
            activity_type="CONVERTED",
            content=f"Converted to student {student.id}",
            created_by=self.tenant.user_id,
        )

        await self._emit(LEAD_CONVERTED, lead, extra={"student_id": str(student.id)})
        await self.session.commit()
        return {"student_id": str(student.id), "already_converted": False}

    async def _emit(self, event_type: str, lead: LeadModel, extra: dict | None = None) -> None:
        payload = {
            "lead_id": str(lead.id),
            "status": lead.status,
            "counselor_id": str(lead.counselor_id) if lead.counselor_id else None,
            "organization_id": str(lead.organization_id),
        }
        if extra:
            payload.update(extra)
        env = EventEnvelope.create(
            event_type=event_type,
            aggregate_type="Lead",
            aggregate_id=lead.id,
            payload=payload,
            source="leads-module",
        )
        self.session.add(OutboxEvent(
            event_id=env.event_id,
            event_type=env.event_type,
            aggregate_type=env.aggregate_type,
            aggregate_id=env.aggregate_id,
            payload=env.payload,
        ))