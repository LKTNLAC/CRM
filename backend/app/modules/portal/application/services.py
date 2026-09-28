"""Portal service — dành cho user role STUDENT và PARENT.

STUDENT: xem thông tin của chính mình
PARENT: xem thông tin của các con
"""

from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.errors import ForbiddenError, NotFoundError
from app.core.tenant import TenantContext
from app.modules.attendance.infrastructure.models import AttendanceModel
from app.modules.classes.infrastructure.models import ClassModel, ClassScheduleModel
from app.modules.enrollments.infrastructure.models import (
    EnrollmentClassModel,
    EnrollmentModel,
)
from app.modules.examinations.infrastructure.models import ExamModel, ExamResultModel
from app.modules.guardians.infrastructure.models import GuardianModel, StudentGuardianModel
from app.modules.students.infrastructure.models import StudentModel


class PortalService:
    def __init__(self, session: AsyncSession, tenant: TenantContext):
        self.session = session
        self.tenant = tenant

    # ============ STUDENT ============

    async def _my_student(self) -> StudentModel:
        if "STUDENT" not in self.tenant.roles:
            raise ForbiddenError("Not a student account")
        stmt = select(StudentModel).where(
            StudentModel.user_id == self.tenant.user_id,
            StudentModel.organization_id == self.tenant.organization_id,
            StudentModel.deleted_at.is_(None),
        )
        s = (await self.session.execute(stmt)).scalar_one_or_none()
        if not s:
            raise NotFoundError("No student profile linked to this account")
        return s

    async def student_me(self) -> StudentModel:
        return await self._my_student()

    async def student_classes(self) -> list[dict]:
        s = await self._my_student()
        stmt = (
            select(ClassModel, EnrollmentClassModel)
            .join(EnrollmentClassModel, EnrollmentClassModel.class_id == ClassModel.id)
            .join(EnrollmentModel, EnrollmentModel.id == EnrollmentClassModel.enrollment_id)
            .where(
                EnrollmentModel.student_id == s.id,
                EnrollmentClassModel.status == "ACTIVE",
                ClassModel.deleted_at.is_(None),
            )
        )
        rows = (await self.session.execute(stmt)).all()
        return [
            {
                "class_id": str(cls.id),
                "class_code": cls.code,
                "class_name": cls.name,
                "room": cls.room,
                "status": cls.status,
                "joined_at": ec.joined_at.isoformat() if ec.joined_at else None,
            }
            for cls, ec in rows
        ]

    async def student_attendance(self, limit: int = 100) -> list[AttendanceModel]:
        s = await self._my_student()
        stmt = select(AttendanceModel).where(
            AttendanceModel.student_id == s.id,
        ).order_by(AttendanceModel.session_date.desc()).limit(limit)
        return (await self.session.execute(stmt)).scalars().all()

    async def student_exams(self) -> list[dict]:
        s = await self._my_student()
        stmt = (
            select(ExamModel, ExamResultModel)
            .join(ExamResultModel, ExamResultModel.exam_id == ExamModel.id)
            .where(ExamResultModel.student_id == s.id)
            .order_by(ExamModel.created_at.desc())
        )
        rows = (await self.session.execute(stmt)).all()
        return [
            {
                "exam_id": str(ex.id),
                "exam_name": ex.name,
                "exam_type": ex.exam_type,
                "max_score": float(ex.max_score),
                "score": float(r.score),
                "grade": r.grade,
                "feedback": r.feedback,
                "published_at": r.published_at.isoformat() if r.published_at else None,
            }
            for ex, r in rows
        ]

    # ============ PARENT ============

    async def _my_guardian(self) -> GuardianModel:
        if "PARENT" not in self.tenant.roles:
            raise ForbiddenError("Not a parent account")
        stmt = select(GuardianModel).where(
            GuardianModel.user_id == self.tenant.user_id,
            GuardianModel.organization_id == self.tenant.organization_id,
            GuardianModel.deleted_at.is_(None),
        )
        g = (await self.session.execute(stmt)).scalar_one_or_none()
        if not g:
            raise NotFoundError("No guardian profile linked to this account")
        return g

    async def parent_children(self) -> list[dict]:
        g = await self._my_guardian()
        stmt = (
            select(StudentModel, StudentGuardianModel)
            .join(StudentGuardianModel, StudentGuardianModel.student_id == StudentModel.id)
            .where(
                StudentGuardianModel.guardian_id == g.id,
                StudentModel.deleted_at.is_(None),
            )
        )
        rows = (await self.session.execute(stmt)).all()
        return [
            {
                "student_id": str(s.id),
                "student_code": s.student_code,
                "full_name": s.full_name,
                "status": s.status,
                "is_primary": sg.is_primary,
            }
            for s, sg in rows
        ]

    async def _ensure_child(self, student_id: UUID) -> StudentModel:
        """Verify student_id thuộc về parent hiện tại."""
        g = await self._my_guardian()
        stmt = select(StudentModel).join(
            StudentGuardianModel, StudentGuardianModel.student_id == StudentModel.id
        ).where(
            StudentGuardianModel.guardian_id == g.id,
            StudentModel.id == student_id,
            StudentModel.deleted_at.is_(None),
        )
        s = (await self.session.execute(stmt)).scalar_one_or_none()
        if not s:
            raise NotFoundError("Child not found")
        return s

    async def parent_child_schedule(self, student_id: UUID) -> list[dict]:
        s = await self._ensure_child(student_id)
        stmt = (
            select(ClassScheduleModel, ClassModel)
            .join(ClassModel, ClassModel.id == ClassScheduleModel.class_id)
            .join(EnrollmentClassModel, EnrollmentClassModel.class_id == ClassModel.id)
            .join(EnrollmentModel, EnrollmentModel.id == EnrollmentClassModel.enrollment_id)
            .where(
                EnrollmentModel.student_id == s.id,
                EnrollmentClassModel.status == "ACTIVE",
                ClassScheduleModel.status == "ACTIVE",
            )
        )
        rows = (await self.session.execute(stmt)).all()
        return [
            {
                "class_id": str(cls.id),
                "class_name": cls.name,
                "day_of_week": sch.day_of_week,
                "start_time": sch.start_time.isoformat(),
                "end_time": sch.end_time.isoformat(),
                "room": sch.room or cls.room,
            }
            for sch, cls in rows
        ]

    async def parent_child_attendance(self, student_id: UUID, limit: int = 100) -> list[AttendanceModel]:
        await self._ensure_child(student_id)
        stmt = select(AttendanceModel).where(
            AttendanceModel.student_id == student_id,
        ).order_by(AttendanceModel.session_date.desc()).limit(limit)
        return (await self.session.execute(stmt)).scalars().all()