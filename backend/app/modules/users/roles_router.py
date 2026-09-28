from sqlalchemy import select
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_session
from app.core.dependencies import require_permission
from app.core.tenant import TenantContext
from app.modules.auth.infrastructure.models import Role
from app.modules.users.schemas import RoleResponse

router = APIRouter(prefix="/roles", tags=["roles"])


@router.get("", response_model=list[RoleResponse])
async def list_roles(
    ctx: TenantContext = Depends(require_permission("role.read")),
    session: AsyncSession = Depends(get_session),
):
    roles = (await session.execute(select(Role).order_by(Role.code))).scalars().all()
    return [
        {
            "id": r.id,
            "code": r.code,
            "name": r.name,
            "permissions": [p.code for p in r.permissions],
        }
        for r in roles
    ]


@router.get("/{role_id}", response_model=RoleResponse)
async def get_role(
    role_id: str,
    ctx: TenantContext = Depends(require_permission("role.read")),
    session: AsyncSession = Depends(get_session),
):
    r = await session.get(Role, role_id)
    if not r:
        from app.core.errors import NotFoundError
        raise NotFoundError("Role not found")
    return {
        "id": r.id,
        "code": r.code,
        "name": r.name,
        "permissions": [p.code for p in r.permissions],
    }