from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_session
from app.core.dependencies import require_permission
from app.core.tenant import TenantContext
from app.modules.guardians.application.services import GuardianService
from app.modules.guardians.schemas import (
    GuardianCreate,
    GuardianResponse,
    GuardianUpdate,
    LinkGuardianRequest,
)
from app.modules.guardians.schemas import LinkUserRequest

router = APIRouter(prefix="/guardians", tags=["guardians"])


@router.get("", response_model=list[GuardianResponse])
async def list_guardians(
    search: str | None = Query(None),
    limit: int = Query(50, le=200),
    offset: int = Query(0, ge=0),
    ctx: TenantContext = Depends(require_permission("guardian.read")),
    session: AsyncSession = Depends(get_session),
):
    return await GuardianService(session, ctx).list(search=search, limit=limit, offset=offset)


@router.post("", response_model=GuardianResponse, status_code=201)
async def create_guardian(
    body: GuardianCreate,
    ctx: TenantContext = Depends(require_permission("guardian.create")),
    session: AsyncSession = Depends(get_session),
):
    return await GuardianService(session, ctx).create(body.model_dump())


@router.get("/{guardian_id}", response_model=GuardianResponse)
async def get_guardian(
    guardian_id: UUID,
    ctx: TenantContext = Depends(require_permission("guardian.read")),
    session: AsyncSession = Depends(get_session),
):
    return await GuardianService(session, ctx).get(guardian_id)


@router.patch("/{guardian_id}", response_model=GuardianResponse)
async def update_guardian(
    guardian_id: UUID,
    body: GuardianUpdate,
    ctx: TenantContext = Depends(require_permission("guardian.update")),
    session: AsyncSession = Depends(get_session),
):
    return await GuardianService(session, ctx).update(guardian_id, body.model_dump(exclude_none=True))


@router.post("/students/{student_id}/link")
async def link_guardian_to_student(
    student_id: UUID,
    body: LinkGuardianRequest,
    ctx: TenantContext = Depends(require_permission("guardian.update")),
    session: AsyncSession = Depends(get_session),
):
    link = await GuardianService(session, ctx).link_to_student(student_id, body.guardian_id, body.is_primary)
    return {"link_id": str(link.id)}

@router.post("/{guardian_id}/link-user", response_model=GuardianResponse)
async def link_user(
    guardian_id: UUID,
    body: LinkUserRequest,
    ctx: TenantContext = Depends(require_permission("guardian.update")),
    session: AsyncSession = Depends(get_session),
):
    return await GuardianService(session, ctx).link_user(guardian_id, body.user_id)


@router.delete("/{guardian_id}/link-user", response_model=GuardianResponse)
async def unlink_user(
    guardian_id: UUID,
    ctx: TenantContext = Depends(require_permission("guardian.update")),
    session: AsyncSession = Depends(get_session),
):
    return await GuardianService(session, ctx).unlink_user(guardian_id)

@router.get("/{guardian_id}/students")
async def list_students(
    guardian_id: UUID,
    ctx: TenantContext = Depends(require_permission("guardian.read")),
    session: AsyncSession = Depends(get_session),
):
    return await GuardianService(session, ctx).list_students(guardian_id)

@router.delete("/{guardian_id}/students/{student_id}", status_code=204)
async def unlink_student(
    guardian_id: UUID,
    student_id: UUID,
    ctx: TenantContext = Depends(require_permission("guardian.update")),
    session: AsyncSession = Depends(get_session),
):
    await GuardianService(session, ctx).unlink_from_student(guardian_id, student_id)