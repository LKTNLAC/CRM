from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_session
from app.core.dependencies import require_permission
from app.core.tenant import TenantContext
from app.modules.enrollments.application.services import EnrollmentService
from app.modules.enrollments.schemas import (
    EnrollmentClassResponse,
    EnrollmentCreate,
    EnrollmentResponse,
    EnrollmentTransfer,
)

router = APIRouter(prefix="/enrollments", tags=["enrollments"])


@router.get("", response_model=list[EnrollmentResponse])
async def list_enrollments(
    student_id: UUID | None = Query(None),
    status: str | None = Query(None),
    limit: int = Query(100, le=200),
    offset: int = Query(0, ge=0),
    ctx: TenantContext = Depends(require_permission("enrollment.read")),
    session: AsyncSession = Depends(get_session),
):
    return await EnrollmentService(session, ctx).list(student_id=student_id, status=status, limit=limit, offset=offset)


@router.post("", response_model=EnrollmentResponse, status_code=201)
async def create_enrollment(
    body: EnrollmentCreate,
    ctx: TenantContext = Depends(require_permission("enrollment.create")),
    session: AsyncSession = Depends(get_session),
):
    return await EnrollmentService(session, ctx).create(body.model_dump())


@router.get("/{enrollment_id}", response_model=EnrollmentResponse)
async def get_enrollment(
    enrollment_id: UUID,
    ctx: TenantContext = Depends(require_permission("enrollment.read")),
    session: AsyncSession = Depends(get_session),
):
    return await EnrollmentService(session, ctx).get(enrollment_id)


@router.get("/{enrollment_id}/classes", response_model=list[EnrollmentClassResponse])
async def list_enrollment_classes(
    enrollment_id: UUID,
    ctx: TenantContext = Depends(require_permission("enrollment.read")),
    session: AsyncSession = Depends(get_session),
):
    return await EnrollmentService(session, ctx).list_classes(enrollment_id)


@router.post("/{enrollment_id}/transfer", response_model=EnrollmentResponse)
async def transfer_enrollment(
    enrollment_id: UUID,
    body: EnrollmentTransfer,
    ctx: TenantContext = Depends(require_permission("enrollment.update")),
    session: AsyncSession = Depends(get_session),
):
    return await EnrollmentService(session, ctx).transfer(enrollment_id, body.model_dump())


@router.post("/{enrollment_id}/cancel", response_model=EnrollmentResponse)
async def cancel_enrollment(
    enrollment_id: UUID,
    ctx: TenantContext = Depends(require_permission("enrollment.cancel")),
    session: AsyncSession = Depends(get_session),
):
    return await EnrollmentService(session, ctx).cancel(enrollment_id)