from datetime import UTC, date, datetime
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.errors import ConflictError, NotFoundError
from app.core.tenant import TenantContext
from app.events.envelope import EventEnvelope
from app.events.outbox import OutboxEvent
from app.modules.enrollments.domain.events import (
    ENROLLMENT_CANCELLED,
    ENROLLMENT_CREATED,
    ENROLLMENT_TRANSFERRED,
)
from app.modules.enrollments.infrastructure.models import (
    EnrollmentClassModel,
    EnrollmentModel,
)


class EnrollmentService:
    def __init__(self, session: AsyncSession, tenant: TenantContext):
        self.session = session
        self.tenant = tenant

    async def list(self, student_id: UUID | None = None, status: str | None = None, limit: int = 100, offset: int = 0):
        stmt = select(EnrollmentModel).where(
            EnrollmentModel.organization_id == self.tenant.organization_id
        )
        if student_id:
            stmt = stmt.where(EnrollmentModel.student_id == student_id)
        if status:
            stmt = stmt.where(EnrollmentModel.status == status)
        stmt = stmt.order_by(EnrollmentModel.created_at.desc()).limit(limit).offset(offset)
        return (await self.session.execute(stmt)).scalars().all()

    async def get(self, enrollment_id: UUID) -> EnrollmentModel:
        stmt = select(EnrollmentModel).where(
            EnrollmentModel.id == enrollment_id,
            EnrollmentModel.organization_id == self.tenant.organization_id,
        )
        e = (await self.session.execute(stmt)).scalar_one_or_none()
        if not e:
            raise NotFoundError("Enrollment not found")
        return e

    async def create(self, data: dict) -> EnrollmentModel:
        from app.modules.students.application.services import StudentService
        from app.modules.classes.application.services import ClassService

        await StudentService(self.session, self.tenant).ensure_exists(data["student_id"])

        class_svc = ClassService(self.session, self.tenant)
        cls = await class_svc.get_for_enrollment(data["class_id"])

        if cls.status not in ("PLANNED", "OPEN", "ACTIVE"):
            raise ConflictError(f"Class is not open for enrollment (status={cls.status})")

        enrolled_count = await class_svc.count_active_students(cls.id)
        if enrolled_count >= cls.capacity:
            raise ConflictError(f"Class is full ({cls.capacity}/{cls.capacity})")

        # Check duplicate active enrollment for same student + course
        existing = (await self.session.execute(
            select(EnrollmentModel).where(
                EnrollmentModel.student_id == data["student_id"],
                EnrollmentModel.course_id == data["course_id"],
                EnrollmentModel.status == "ACTIVE",
            )
        )).scalar_one_or_none()
        if existing:
            raise ConflictError("Student already has active enrollment in this course")

        enrollment_data = {k: v for k, v in data.items() if k != "class_id"}
        enrollment = EnrollmentModel(
            organization_id=self.tenant.organization_id,
            branch_id=self.tenant.branch_id,
            created_by=self.tenant.user_id,
            **enrollment_data,
        )
        self.session.add(enrollment)
        await self.session.flush()

        ec = EnrollmentClassModel(
            enrollment_id=enrollment.id,
            class_id=cls.id,
            joined_at=data["start_date"],
            status="ACTIVE",
        )
        self.session.add(ec)

        await self._emit(ENROLLMENT_CREATED, enrollment, {"class_id": str(cls.id)})
        await self.session.commit()
        return enrollment

    async def transfer(self, enrollment_id: UUID, data: dict) -> EnrollmentModel:
        enrollment = await self.get(enrollment_id)
        if enrollment.status != "ACTIVE":
            raise ConflictError("Only ACTIVE enrollment can be transferred")

        from app.modules.classes.application.services import ClassService
        new_class = await ClassService(self.session, self.tenant).get(data["new_class_id"])

        # Đóng record cũ
        old = (await self.session.execute(
            select(EnrollmentClassModel).where(
                EnrollmentClassModel.enrollment_id == enrollment_id,
                EnrollmentClassModel.status == "ACTIVE",
            )
        )).scalar_one_or_none()
        if not old:
            raise ConflictError("No active class assignment found")

        old.left_at = data["transfer_date"]
        old.left_reason = data.get("reason") or "TRANSFERRED"
        old.status = "TRANSFERRED"

        # Tạo record mới
        new_ec = EnrollmentClassModel(
            enrollment_id=enrollment_id,
            class_id=new_class.id,
            joined_at=data["transfer_date"],
            status="ACTIVE",
        )
        self.session.add(new_ec)

        await self._emit(ENROLLMENT_TRANSFERRED, enrollment, {
            "old_class_id": str(old.class_id),
            "new_class_id": str(new_class.id),
        })
        await self.session.commit()
        return enrollment

    async def cancel(self, enrollment_id: UUID) -> EnrollmentModel:
        enrollment = await self.get(enrollment_id)
        if enrollment.status != "ACTIVE":
            raise ConflictError("Only ACTIVE enrollment can be cancelled")

        enrollment.status = "CANCELLED"
        enrollment.end_date = date.today()

        # Đóng class assignment
        old = (await self.session.execute(
            select(EnrollmentClassModel).where(
                EnrollmentClassModel.enrollment_id == enrollment_id,
                EnrollmentClassModel.status == "ACTIVE",
            )
        )).scalar_one_or_none()
        if old:
            old.left_at = date.today()
            old.left_reason = "CANCELLED"
            old.status = "DROPPED"

        await self._emit(ENROLLMENT_CANCELLED, enrollment, {})
        await self.session.commit()
        return enrollment

    async def list_classes(self, enrollment_id: UUID):
        await self.get(enrollment_id)
        stmt = select(EnrollmentClassModel).where(
            EnrollmentClassModel.enrollment_id == enrollment_id
        ).order_by(EnrollmentClassModel.joined_at)
        return (await self.session.execute(stmt)).scalars().all()

    async def _emit(self, event_type: str, enrollment: EnrollmentModel, extra: dict) -> None:
        payload = {
            "enrollment_id": str(enrollment.id),
            "student_id": str(enrollment.student_id),
            "course_id": str(enrollment.course_id),
            "status": enrollment.status,
            "organization_id": str(enrollment.organization_id),
            
        }
        payload.update(extra)
        env = EventEnvelope.create(
            event_type=event_type,
            aggregate_type="Enrollment",
            aggregate_id=enrollment.id,
            payload=payload,
            source="enrollments-module",
        )
        self.session.add(OutboxEvent(
            event_id=env.event_id,
            event_type=env.event_type,
            aggregate_type=env.aggregate_type,
            aggregate_id=env.aggregate_id,
            payload=env.payload,
        ))