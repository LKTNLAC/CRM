"""Data scope helper.

COUNSELOR: chỉ thấy lead/student được assign cho mình (counselor_id = user_id)
TEACHER: chỉ thấy class/student trong class được assign
ACADEMIC_MANAGER/SCHOOL_ADMIN: toàn organization
"""

from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.tenant import TenantContext


def is_org_wide(roles: list[str]) -> bool:
    return any(r in roles for r in ("SUPER_ADMIN", "SCHOOL_ADMIN", "ACADEMIC_MANAGER"))


def is_counselor_only(roles: list[str]) -> bool:
    return "COUNSELOR" in roles and not is_org_wide(roles)


def is_teacher_only(roles: list[str]) -> bool:
    return "TEACHER" in roles and not is_org_wide(roles)


async def get_teacher_class_ids(session: AsyncSession, user_id: UUID) -> list[UUID]:
    """Lấy danh sách class_id mà teacher được assign (active)."""
    from app.modules.classes.infrastructure.models import ClassTeacherModel
    stmt = select(ClassTeacherModel.class_id).where(
        ClassTeacherModel.teacher_id == user_id,
        ClassTeacherModel.status == "ACTIVE",
    )
    return [row[0] for row in (await session.execute(stmt)).all()]