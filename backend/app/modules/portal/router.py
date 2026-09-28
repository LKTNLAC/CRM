from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_session
from app.core.dependencies import get_tenant_context
from app.core.tenant import TenantContext
from app.modules.portal.application.services import PortalService
from app.modules.portal.schemas import (
    AttendanceItem,
    ChildItem,
    ClassItem,
    ExamResultItem,
    ScheduleItem,
    StudentPortalProfile,
)

router = APIRouter(prefix="/portal", tags=["portal"])


# ============ STUDENT ============

@router.get("/student/me", response_model=StudentPortalProfile)
async def student_me(
    ctx: TenantContext = Depends(get_tenant_context),
    session: AsyncSession = Depends(get_session),
):
    return await PortalService(session, ctx).student_me()


@router.get("/student/classes", response_model=list[ClassItem])
async def student_classes(
    ctx: TenantContext = Depends(get_tenant_context),
    session: AsyncSession = Depends(get_session),
):
    return await PortalService(session, ctx).student_classes()


@router.get("/student/attendance", response_model=list[AttendanceItem])
async def student_attendance(
    limit: int = Query(100, le=500),
    ctx: TenantContext = Depends(get_tenant_context),
    session: AsyncSession = Depends(get_session),
):
    return await PortalService(session, ctx).student_attendance(limit=limit)


@router.get("/student/exams", response_model=list[ExamResultItem])
async def student_exams(
    ctx: TenantContext = Depends(get_tenant_context),
    session: AsyncSession = Depends(get_session),
):
    return await PortalService(session, ctx).student_exams()


# ============ PARENT ============

@router.get("/parent/children", response_model=list[ChildItem])
async def parent_children(
    ctx: TenantContext = Depends(get_tenant_context),
    session: AsyncSession = Depends(get_session),
):
    return await PortalService(session, ctx).parent_children()


@router.get("/parent/child/{student_id}/schedule", response_model=list[ScheduleItem])
async def parent_child_schedule(
    student_id: UUID,
    ctx: TenantContext = Depends(get_tenant_context),
    session: AsyncSession = Depends(get_session),
):
    return await PortalService(session, ctx).parent_child_schedule(student_id)


@router.get("/parent/child/{student_id}/attendance", response_model=list[AttendanceItem])
async def parent_child_attendance(
    student_id: UUID,
    limit: int = Query(100, le=500),
    ctx: TenantContext = Depends(get_tenant_context),
    session: AsyncSession = Depends(get_session),
):
    return await PortalService(session, ctx).parent_child_attendance(student_id, limit=limit)