from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.errors import ConflictError, NotFoundError
from app.core.tenant import TenantContext
from app.modules.courses.infrastructure.models import CourseLevelModel, CourseModel


class CourseService:
    def __init__(self, session: AsyncSession, tenant: TenantContext):
        self.session = session
        self.tenant = tenant

    async def list(self, limit: int = 100, offset: int = 0):
        stmt = select(CourseModel).where(
            CourseModel.organization_id == self.tenant.organization_id,
            CourseModel.deleted_at.is_(None),
        ).order_by(CourseModel.created_at.desc()).limit(limit).offset(offset)
        return (await self.session.execute(stmt)).scalars().all()

    async def get(self, course_id: UUID) -> CourseModel:
        stmt = select(CourseModel).where(
            CourseModel.id == course_id,
            CourseModel.organization_id == self.tenant.organization_id,
            CourseModel.deleted_at.is_(None),
        )
        c = (await self.session.execute(stmt)).scalar_one_or_none()
        if not c:
            raise NotFoundError("Course not found")
        return c

    async def create(self, data: dict) -> CourseModel:
        # Check unique code
        existing = (await self.session.execute(
            select(CourseModel).where(
                CourseModel.organization_id == self.tenant.organization_id,
                CourseModel.code == data["code"],
            )
        )).scalar_one_or_none()
        if existing:
            raise ConflictError(f"Course code {data['code']} already exists")

        c = CourseModel(organization_id=self.tenant.organization_id, **data)
        self.session.add(c)
        await self.session.flush()
        await self.session.commit()
        return c

    async def update(self, course_id: UUID, data: dict) -> CourseModel:
        c = await self.get(course_id)
        for k, v in data.items():
            if v is not None:
                setattr(c, k, v)
        await self.session.commit()
        return c

    async def list_levels(self, course_id: UUID):
        await self.get(course_id)
        stmt = select(CourseLevelModel).where(
            CourseLevelModel.course_id == course_id
        ).order_by(CourseLevelModel.sequence)
        return (await self.session.execute(stmt)).scalars().all()

    async def create_level(self, course_id: UUID, data: dict) -> CourseLevelModel:
        await self.get(course_id)
        level = CourseLevelModel(course_id=course_id, **data)
        self.session.add(level)
        await self.session.flush()
        await self.session.commit()
        return level
    
    async def update_level(self, course_id: UUID, level_id: UUID, data: dict) -> CourseLevelModel:
        await self.get(course_id)
        stmt = select(CourseLevelModel).where(
            CourseLevelModel.id == level_id,
            CourseLevelModel.course_id == course_id,
        )
        level = (await self.session.execute(stmt)).scalar_one_or_none()
        if not level:
            raise NotFoundError("Level not found")

        for k, v in data.items():
            if v is not None:
                setattr(level, k, v)

        await self.session.commit()
        return level

    async def delete_level(self, course_id: UUID, level_id: UUID) -> None:
        await self.get(course_id)
        stmt = select(CourseLevelModel).where(
            CourseLevelModel.id == level_id,
            CourseLevelModel.course_id == course_id,
        )
        level = (await self.session.execute(stmt)).scalar_one_or_none()
        if not level:
            raise NotFoundError("Level not found")

        # Kiểm tra có class nào đang dùng level này không
        from app.modules.classes.infrastructure.models import ClassModel
        using = (await self.session.execute(
            select(ClassModel.id).where(
                ClassModel.level_id == level_id,
                ClassModel.deleted_at.is_(None),
            ).limit(1)
        )).scalar_one_or_none()
        if using:
            raise ConflictError("Không thể xóa — có lớp học đang sử dụng cấp độ này")

        await self.session.delete(level)
        await self.session.commit()