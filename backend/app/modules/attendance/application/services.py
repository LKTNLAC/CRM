from datetime import UTC, date, datetime
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.errors import ConflictError, ForbiddenError, NotFoundError
from app.core.tenant import TenantContext
from app.events.envelope import EventEnvelope
from app.events.outbox import OutboxEvent
from app.modules.attendance.domain.events import (
    ATTENDANCE_CORRECTED,
    ATTENDANCE_RECORDED,
    STUDENT_ABSENT,
)
from app.modules.attendance.infrastructure.models import (
    AttendanceCorrectionModel,
    AttendanceModel,
)

CONSECUTIVE_ABSENT_THRESHOLD = 2


async def _ensure_teacher_owns_class(session: AsyncSession, tenant: TenantContext, class_id: UUID) -> None:
    """Nếu user chỉ có role TEACHER (không có quyền org-wide),
    verify teacher được assign vào class."""
    from app.core.scope import is_teacher_only
    from app.modules.classes.infrastructure.models import ClassTeacherModel

    if not is_teacher_only(tenant.roles):
        return

    stmt = select(ClassTeacherModel).where(
        ClassTeacherModel.class_id == class_id,
        ClassTeacherModel.teacher_id == tenant.user_id,
        ClassTeacherModel.status == "ACTIVE",
    )
    ct = (await session.execute(stmt)).scalar_one_or_none()
    if not ct:
        raise ForbiddenError("Bạn không được phân công lớp này")


class AttendanceService:
    def __init__(self, session: AsyncSession, tenant: TenantContext):
        self.session = session
        self.tenant = tenant

    async def record(self, data: dict) -> AttendanceModel:
        await _ensure_teacher_owns_class(self.session, self.tenant, data["class_id"])

        existing = (
            await self.session.execute(
                select(AttendanceModel).where(
                    AttendanceModel.class_id == data["class_id"],
                    AttendanceModel.student_id == data["student_id"],
                    AttendanceModel.session_date == data["session_date"],
                )
            )
        ).scalar_one_or_none()
        if existing:
            raise ConflictError("Attendance already recorded for this session")

        a = AttendanceModel(
            organization_id=self.tenant.organization_id,
            branch_id=self.tenant.branch_id,
            recorded_by=self.tenant.user_id,
            **data,
        )
        self.session.add(a)
        await self.session.flush()

        await self._emit(ATTENDANCE_RECORDED, a)

        if a.status == "ABSENT":
            await self._check_consecutive_absent(a)

        await self.session.commit()
        return a

    async def bulk_record(
        self, class_id: UUID, session_date: date, records: list[dict]
    ) -> list[AttendanceModel]:
        await _ensure_teacher_owns_class(self.session, self.tenant, class_id)

        created: list[AttendanceModel] = []
        for r in records:
            data = {
                "class_id": class_id,
                "student_id": r["student_id"],
                "session_date": session_date,
                "status": r["status"],
                "note": r.get("note"),
            }
            existing = (
                await self.session.execute(
                    select(AttendanceModel).where(
                        AttendanceModel.class_id == class_id,
                        AttendanceModel.student_id == data["student_id"],
                        AttendanceModel.session_date == session_date,
                    )
                )
            ).scalar_one_or_none()
            if existing:
                continue

            a = AttendanceModel(
                organization_id=self.tenant.organization_id,
                branch_id=self.tenant.branch_id,
                recorded_by=self.tenant.user_id,
                **data,
            )
            self.session.add(a)
            await self.session.flush()
            created.append(a)
            await self._emit(ATTENDANCE_RECORDED, a)

        for a in created:
            if a.status == "ABSENT":
                await self._check_consecutive_absent(a)

        await self.session.commit()
        return created

    async def correct(
        self, attendance_id: UUID, new_status: str, reason: str | None
    ) -> AttendanceModel:
        stmt = select(AttendanceModel).where(
            AttendanceModel.id == attendance_id,
            AttendanceModel.organization_id == self.tenant.organization_id,
        )
        a = (await self.session.execute(stmt)).scalar_one_or_none()
        if not a:
            raise NotFoundError("Attendance not found")

        await _ensure_teacher_owns_class(self.session, self.tenant, a.class_id)

        old = a.status
        a.status = new_status
        correction = AttendanceCorrectionModel(
            attendance_id=a.id,
            old_status=old,
            new_status=new_status,
            reason=reason,
            corrected_by=self.tenant.user_id,
        )
        self.session.add(correction)
        await self._emit(
            ATTENDANCE_CORRECTED, a, {"old_status": old, "new_status": new_status}
        )
        await self.session.commit()
        return a

    async def list_by_class(
        self,
        class_id: UUID,
        session_date: date | None = None,
        limit: int = 200,
        offset: int = 0,
    ):
        stmt = select(AttendanceModel).where(
            AttendanceModel.organization_id == self.tenant.organization_id,
            AttendanceModel.class_id == class_id,
        )
        if session_date:
            stmt = stmt.where(AttendanceModel.session_date == session_date)
        stmt = (
            stmt.order_by(AttendanceModel.session_date.desc())
            .limit(limit)
            .offset(offset)
        )
        return (await self.session.execute(stmt)).scalars().all()

    async def list_by_student(
        self, student_id: UUID, limit: int = 100, offset: int = 0
    ):
        stmt = (
            select(AttendanceModel)
            .where(
                AttendanceModel.organization_id == self.tenant.organization_id,
                AttendanceModel.student_id == student_id,
            )
            .order_by(AttendanceModel.session_date.desc())
            .limit(limit)
            .offset(offset)
        )
        return (await self.session.execute(stmt)).scalars().all()

    async def _check_consecutive_absent(self, attendance: AttendanceModel) -> None:
        """Đếm số buổi ABSENT liên tiếp gần nhất của student trong class."""
        stmt = (
            select(AttendanceModel)
            .where(
                AttendanceModel.class_id == attendance.class_id,
                AttendanceModel.student_id == attendance.student_id,
                AttendanceModel.session_date <= attendance.session_date,
            )
            .order_by(AttendanceModel.session_date.desc())
            .limit(CONSECUTIVE_ABSENT_THRESHOLD)
        )

        recent = (await self.session.execute(stmt)).scalars().all()
        if len(recent) >= CONSECUTIVE_ABSENT_THRESHOLD and all(
            r.status == "ABSENT" for r in recent
        ):
            await self._emit(
                STUDENT_ABSENT,
                attendance,
                {
                    "consecutive_absent": CONSECUTIVE_ABSENT_THRESHOLD,
                    "student_id": str(attendance.student_id),
                    "class_id": str(attendance.class_id),
                },
            )

    async def _emit(
        self,
        event_type: str,
        attendance: AttendanceModel,
        extra: dict | None = None,
    ) -> None:
        payload = {
            "attendance_id": str(attendance.id),
            "class_id": str(attendance.class_id),
            "student_id": str(attendance.student_id),
            "session_date": attendance.session_date.isoformat(),
            "status": attendance.status,
            "organization_id": str(attendance.organization_id),
        }
        if extra:
            payload.update(extra)
        env = EventEnvelope.create(
            event_type=event_type,
            aggregate_type="Attendance",
            aggregate_id=attendance.id,
            payload=payload,
            source="attendance-module",
        )
        self.session.add(
            OutboxEvent(
                event_id=env.event_id,
                event_type=env.event_type,
                aggregate_type=env.aggregate_type,
                aggregate_id=env.aggregate_id,
                payload=env.payload,
            )
        )