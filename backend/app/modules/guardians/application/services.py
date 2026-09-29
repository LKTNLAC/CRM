from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.errors import NotFoundError
from app.core.tenant import TenantContext
from app.modules.guardians.infrastructure.models import GuardianModel, StudentGuardianModel
from app.core.errors import ConflictError, NotFoundError

from typing import List

class GuardianService:
    def __init__(self, session: AsyncSession, tenant: TenantContext):
        self.session = session
        self.tenant = tenant

    async def list(self, search: str | None = None, limit: int = 50, offset: int = 0):
        stmt = select(GuardianModel).where(
            GuardianModel.organization_id == self.tenant.organization_id,
            GuardianModel.deleted_at.is_(None),
        )
        if search:
            stmt = stmt.where(GuardianModel.full_name.ilike(f"%{search}%"))
        stmt = stmt.order_by(GuardianModel.created_at.desc()).limit(limit).offset(offset)
        return (await self.session.execute(stmt)).scalars().all()

    async def get(self, guardian_id: UUID) -> GuardianModel:
        stmt = select(GuardianModel).where(
            GuardianModel.id == guardian_id,
            GuardianModel.organization_id == self.tenant.organization_id,
            GuardianModel.deleted_at.is_(None),
        )
        g = (await self.session.execute(stmt)).scalar_one_or_none()
        if not g:
            raise NotFoundError("Guardian not found")
        return g

    async def create(self, data: dict) -> GuardianModel:
        g = GuardianModel(organization_id=self.tenant.organization_id, **data)
        self.session.add(g)
        await self.session.flush()
        await self.session.commit()
        return g

    async def update(self, guardian_id: UUID, data: dict) -> GuardianModel:
        g = await self.get(guardian_id)
        for k, v in data.items():
            if v is not None:
                setattr(g, k, v)
        await self.session.commit()
        return g

    async def link_to_student(self, student_id: UUID, guardian_id: UUID, is_primary: bool) -> StudentGuardianModel:
        from app.modules.students.application.services import StudentService
        await StudentService(self.session, self.tenant).ensure_exists(student_id)
        await self.get(guardian_id)

        # Check đã link chưa
        existing = (await self.session.execute(
            select(StudentGuardianModel).where(
                StudentGuardianModel.student_id == student_id,
                StudentGuardianModel.guardian_id == guardian_id,
            )
        )).scalar_one_or_none()
        if existing:
            existing.is_primary = is_primary
            await self.session.commit()
            return existing

        link = StudentGuardianModel(student_id=student_id, guardian_id=guardian_id, is_primary=is_primary)
        self.session.add(link)
        await self.session.commit()
        return link
    
    async def link_user(self, guardian_id: UUID, user_id: UUID) -> GuardianModel:
        from app.modules.auth.infrastructure.models import User
        g = await self.get(guardian_id)

        user = (await self.session.execute(
            select(User).where(
                User.id == user_id,
                User.organization_id == self.tenant.organization_id,
                User.deleted_at.is_(None),
            )
        )).scalar_one_or_none()
        if not user:
            raise NotFoundError("User not found")

        existing = (await self.session.execute(
            select(GuardianModel).where(
                GuardianModel.user_id == user_id,
                GuardianModel.id != guardian_id,
                GuardianModel.deleted_at.is_(None),
            )
        )).scalar_one_or_none()
        if existing:
            raise ConflictError("User already linked to another guardian")

        if g.user_id and g.user_id != user_id:
            raise ConflictError("Guardian already has a linked user")

        g.user_id = user_id
        await self.session.commit()
        return g

    async def unlink_user(self, guardian_id: UUID) -> GuardianModel:
        g = await self.get(guardian_id)
        g.user_id = None
        await self.session.commit()
        return g
    
    async def list_students(self, guardian_id: UUID) -> List[dict]:
        """Lấy danh sách học viên được guardian này giám hộ."""
        from app.modules.guardians.infrastructure.models import StudentGuardianModel
        from app.modules.students.infrastructure.models import StudentModel

        await self.get(guardian_id)

        stmt = (
            select(StudentModel, StudentGuardianModel)
            .join(StudentGuardianModel, StudentGuardianModel.student_id == StudentModel.id)
            .where(
                StudentGuardianModel.guardian_id == guardian_id,
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
        
    async def unlink_from_student(self, guardian_id: UUID, student_id: UUID) -> None:
        from app.modules.guardians.infrastructure.models import StudentGuardianModel
        stmt = select(StudentGuardianModel).where(
            StudentGuardianModel.guardian_id == guardian_id,
            StudentGuardianModel.student_id == student_id,
        )
        link = (await self.session.execute(stmt)).scalar_one_or_none()
        if not link:
            raise NotFoundError("Link not found")
        await self.session.delete(link)
        await self.session.commit()
        
        