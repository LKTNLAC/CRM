from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.errors import ConflictError, NotFoundError
from app.core.tenant import TenantContext
from app.modules.classes.infrastructure.models import (
    ClassModel,
    ClassScheduleModel,
    ClassTeacherModel,
)
from app.modules.enrollments.infrastructure.models import (
    EnrollmentClassModel,
)
from app.core.errors import ConflictError, NotFoundError

from datetime import date
from typing import Any

class ClassService:
    def __init__(self, session: AsyncSession, tenant: TenantContext):
        self.session = session
        self.tenant = tenant

    async def list(self, status=None, course_id=None, limit=100, offset=0):
        from app.core.scope import is_teacher_only, get_teacher_class_ids

        stmt = select(ClassModel).where(
            ClassModel.organization_id == self.tenant.organization_id,
            ClassModel.deleted_at.is_(None),
        )
        if status:
            stmt = stmt.where(ClassModel.status == status)
        if course_id:
            stmt = stmt.where(ClassModel.course_id == course_id)

        if is_teacher_only(self.tenant.roles):
            class_ids = await get_teacher_class_ids(self.session, self.tenant.user_id)
            if class_ids:
                stmt = stmt.where(ClassModel.id.in_(class_ids))
            else:
                stmt = stmt.where(False)

        stmt = stmt.order_by(ClassModel.created_at.desc()).limit(limit).offset(offset)
        return (await self.session.execute(stmt)).scalars().all()

    async def get(self, class_id: UUID) -> ClassModel:
        stmt = select(ClassModel).where(
            ClassModel.id == class_id,
            ClassModel.organization_id == self.tenant.organization_id,
            ClassModel.deleted_at.is_(None),
        )
        c = (await self.session.execute(stmt)).scalar_one_or_none()
        if not c:
            raise NotFoundError("Class not found")
        return c

    async def create(self, data: dict) -> ClassModel:
        existing = (await self.session.execute(
            select(ClassModel).where(
                ClassModel.organization_id == self.tenant.organization_id,
                ClassModel.code == data["code"],
            )
        )).scalar_one_or_none()
        if existing:
            raise ConflictError(f"Class code {data['code']} already exists")

        c = ClassModel(
            organization_id=self.tenant.organization_id,
            branch_id=self.tenant.branch_id,
            **data,
        )
        self.session.add(c)
        await self.session.flush()
        await self.session.commit()
        return c

    async def update(self, class_id: UUID, data: dict) -> ClassModel:
        c = await self.get(class_id)
        for k, v in data.items():
            if v is not None:
                setattr(c, k, v)
        await self.session.commit()
        return c

    async def add_schedule(self, class_id: UUID, data: dict) -> ClassScheduleModel:
        await self.get(class_id)
        # Check conflict: cùng class, cùng day, overlap time
        stmt = select(ClassScheduleModel).where(
            ClassScheduleModel.class_id == class_id,
            ClassScheduleModel.day_of_week == data["day_of_week"],
            ClassScheduleModel.status == "ACTIVE",
        )
        existing = (await self.session.execute(stmt)).scalars().all()
        for s in existing:
            if not (data["end_time"] <= s.start_time or data["start_time"] >= s.end_time):
                raise ConflictError(f"Schedule conflict with {s.start_time}-{s.end_time}")

        s = ClassScheduleModel(class_id=class_id, **data)
        self.session.add(s)
        await self.session.flush()
        await self.session.commit()
        return s

    async def list_schedules(self, class_id: UUID):
        await self.get(class_id)
        stmt = select(ClassScheduleModel).where(
            ClassScheduleModel.class_id == class_id,
            ClassScheduleModel.status == "ACTIVE",
        ).order_by(ClassScheduleModel.day_of_week, ClassScheduleModel.start_time)
        return (await self.session.execute(stmt)).scalars().all()

    async def assign_teacher(self, class_id: UUID, data: dict) -> ClassTeacherModel:
        await self.get(class_id)

        # Đóng assignment cũ nếu cùng role
        if data["role"] == "MAIN":
            old = (await self.session.execute(
                select(ClassTeacherModel).where(
                    ClassTeacherModel.class_id == class_id,
                    ClassTeacherModel.role == "MAIN",
                    ClassTeacherModel.status == "ACTIVE",
                )
            )).scalars().all()
            for o in old:
                o.status = "REPLACED"
                o.to_date = data["from_date"]

        ct = ClassTeacherModel(class_id=class_id, **data)
        self.session.add(ct)
        await self.session.flush()
        await self.session.commit()
        return ct

    async def count_enrolled(self, class_id: UUID) -> int:
        stmt = select(func.count()).select_from(EnrollmentClassModel).where(
            EnrollmentClassModel.class_id == class_id,
            EnrollmentClassModel.status == "ACTIVE",
        )
        return (await self.session.execute(stmt)).scalar_one()
    
    async def get_for_enrollment(self, class_id: UUID):
        """Public API cho enrollments: lock row + return class model."""
        from sqlalchemy import select
        from app.modules.classes.infrastructure.models import ClassModel
        from app.core.errors import NotFoundError
        stmt = select(ClassModel).where(
            ClassModel.id == class_id,
            ClassModel.organization_id == self.tenant.organization_id,
            ClassModel.deleted_at.is_(None),
        ).with_for_update()
        cls = (await self.session.execute(stmt)).scalar_one_or_none()
        if not cls:
            raise NotFoundError("Class not found")
        return cls

    async def count_active_students(self, class_id: UUID) -> int:
        """Public API: đếm học viên đang active trong lớp. Không import model enrollment."""
        from sqlalchemy import func, select
        from app.modules.enrollments.infrastructure.models import EnrollmentClassModel
        stmt = select(func.count()).select_from(EnrollmentClassModel).where(
            EnrollmentClassModel.class_id == class_id,
            EnrollmentClassModel.status == "ACTIVE",
        )
        return (await self.session.execute(stmt)).scalar_one()
    
    async def update_schedule(self, class_id: UUID, schedule_id: UUID, data: dict) -> ClassScheduleModel:
        await self.get(class_id)
        stmt = select(ClassScheduleModel).where(
            ClassScheduleModel.id == schedule_id,
            ClassScheduleModel.class_id == class_id,
        )
        s = (await self.session.execute(stmt)).scalar_one_or_none()
        if not s:
            raise NotFoundError("Schedule not found")

        for k, v in data.items():
            if v is not None:
                setattr(s, k, v)

        await self.session.commit()
        return s

    async def delete_schedule(self, class_id: UUID, schedule_id: UUID) -> None:
        await self.get(class_id)
        stmt = select(ClassScheduleModel).where(
            ClassScheduleModel.id == schedule_id,
            ClassScheduleModel.class_id == class_id,
        )
        s = (await self.session.execute(stmt)).scalar_one_or_none()
        if not s:
            raise NotFoundError("Schedule not found")
        await self.session.delete(s)
        await self.session.commit()
        
    async def list_teachers(self, class_id: UUID) -> list[Any]:
        from app.modules.auth.infrastructure.models import User
        await self.get(class_id)
        stmt = (
            select(ClassTeacherModel, User)
            .join(User, User.id == ClassTeacherModel.teacher_id)
            .where(
                ClassTeacherModel.class_id == class_id,
                ClassTeacherModel.status == "ACTIVE",
            )
        )
        rows = (await self.session.execute(stmt)).all()
        return [
            {
                "id": str(ct.id),
                "teacher_id": str(ct.teacher_id),
                "teacher_name": u.full_name,
                "teacher_email": u.email,
                "role": ct.role,
                "from_date": ct.from_date.isoformat() if ct.from_date else None,
            }
            for ct, u in rows
        ]
        
    @router.delete("/{class_id}/teachers/{teacher_id}", status_code=204)
    async def unassign_teacher(
        class_id: UUID,
        teacher_id: UUID,
        ctx: TenantContext = Depends(require_permission("class.assign_teacher")),
        session: AsyncSession = Depends(get_session),
    ):
        await ClassService(session, ctx).unassign_teacher(class_id, teacher_id)
    
    async def unassign_teacher(self, class_id: UUID, teacher_id: UUID) -> None:
        stmt = select(ClassTeacherModel).where(
            ClassTeacherModel.class_id == class_id,
            ClassTeacherModel.teacher_id == teacher_id,
            ClassTeacherModel.status == "ACTIVE",
        )
        ct = (await self.session.execute(stmt)).scalar_one_or_none()
        if not ct:
            raise NotFoundError("Teacher assignment not found")
        ct.status = "REPLACED"
        ct.to_date = date.today()
        await self.session.commit()
    