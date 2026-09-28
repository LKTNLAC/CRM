from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_session
from app.core.dependencies import get_tenant_context, require_permission
from app.core.tenant import TenantContext
from app.modules.users.application.services import UserService
from app.modules.users.schemas import (
    AssignRoles,
    ChangePassword,
    ResetPassword,
    UserCreate,
    UserResponse,
    UserUpdate,
)

router = APIRouter(prefix="/users", tags=["users"])


def _serialize(u) -> dict:
    return {
        "id": u.id,
        "email": u.email,
        "full_name": u.full_name,
        "organization_id": u.organization_id,
        "branch_id": u.branch_id,
        "roles": [r.code for r in u.roles],
        "is_active": u.is_active,
        "created_at": u.created_at,
    }


@router.get("/me", response_model=UserResponse)
async def me(
    ctx: TenantContext = Depends(get_tenant_context),
    session: AsyncSession = Depends(get_session),
):
    u = await UserService(session, ctx).get(ctx.user_id)
    return _serialize(u)


@router.get("", response_model=list[UserResponse])
async def list_users(
    role: str | None = Query(None),
    search: str | None = Query(None),
    limit: int = Query(50, le=200),
    offset: int = Query(0, ge=0),
    ctx: TenantContext = Depends(require_permission("user.read")),
    session: AsyncSession = Depends(get_session),
):
    users = await UserService(session, ctx).list_users(role_code=role, search=search, limit=limit, offset=offset)
    return [_serialize(u) for u in users]


@router.post("", response_model=UserResponse, status_code=201)
async def create_user(
    body: UserCreate,
    ctx: TenantContext = Depends(require_permission("user.create")),
    session: AsyncSession = Depends(get_session),
):
    u = await UserService(session, ctx).create(body.model_dump())
    return _serialize(u)


@router.get("/{user_id}", response_model=UserResponse)
async def get_user(
    user_id: UUID,
    ctx: TenantContext = Depends(require_permission("user.read")),
    session: AsyncSession = Depends(get_session),
):
    u = await UserService(session, ctx).get(user_id)
    return _serialize(u)


@router.patch("/{user_id}", response_model=UserResponse)
async def update_user(
    user_id: UUID,
    body: UserUpdate,
    ctx: TenantContext = Depends(require_permission("user.update")),
    session: AsyncSession = Depends(get_session),
):
    u = await UserService(session, ctx).update(user_id, body.model_dump(exclude_none=True))
    return _serialize(u)


@router.post("/{user_id}/roles", response_model=UserResponse)
async def assign_roles(
    user_id: UUID,
    body: AssignRoles,
    ctx: TenantContext = Depends(require_permission("user.update")),
    session: AsyncSession = Depends(get_session),
):
    u = await UserService(session, ctx).assign_roles(user_id, body.role_codes)
    return _serialize(u)


@router.post("/{user_id}/reset-password", status_code=204)
async def reset_password(
    user_id: UUID,
    body: ResetPassword,
    ctx: TenantContext = Depends(require_permission("user.update")),
    session: AsyncSession = Depends(get_session),
):
    await UserService(session, ctx).reset_password(user_id, body.new_password)


@router.post("/{user_id}/deactivate", response_model=UserResponse)
async def deactivate(
    user_id: UUID,
    ctx: TenantContext = Depends(require_permission("user.delete")),
    session: AsyncSession = Depends(get_session),
):
    u = await UserService(session, ctx).deactivate(user_id)
    return _serialize(u)


@router.post("/me/change-password", status_code=204)
async def change_password(
    body: ChangePassword,
    ctx: TenantContext = Depends(get_tenant_context),
    session: AsyncSession = Depends(get_session),
):
    await UserService(session, ctx).change_own_password(body.current_password, body.new_password)