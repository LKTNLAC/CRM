from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_session
from app.core.dependencies import require_permission
from app.core.tenant import TenantContext
from app.modules.reports.application.services import ReportService
from app.modules.reports.schemas import (
    AttendanceSummaryResponse,
    ClassFillItem,
    DashboardResponse,
    ExamDistributionResponse,
    LeadByCounselorItem,
    LeadBySourceItem,
    LeadFunnelResponse,
    StudentSummaryResponse,
    TaskSummaryResponse,
)

router = APIRouter(prefix="/reports", tags=["reports"])


@router.get("/dashboard", response_model=DashboardResponse)
async def dashboard(
    ctx: TenantContext = Depends(require_permission("report.dashboard")),
    session: AsyncSession = Depends(get_session),
):
    return await ReportService(session, ctx).dashboard()


@router.get("/sales/funnel", response_model=LeadFunnelResponse)
async def lead_funnel(
    days: int = Query(30, ge=1, le=365),
    ctx: TenantContext = Depends(require_permission("report.sales")),
    session: AsyncSession = Depends(get_session),
):
    return await ReportService(session, ctx).lead_funnel(days=days)


@router.get("/sales/by-source", response_model=list[LeadBySourceItem])
async def lead_by_source(
    days: int = Query(30, ge=1, le=365),
    ctx: TenantContext = Depends(require_permission("report.sales")),
    session: AsyncSession = Depends(get_session),
):
    return await ReportService(session, ctx).lead_by_source(days=days)


@router.get("/sales/by-counselor", response_model=list[LeadByCounselorItem])
async def lead_by_counselor(
    days: int = Query(30, ge=1, le=365),
    ctx: TenantContext = Depends(require_permission("report.sales")),
    session: AsyncSession = Depends(get_session),
):
    return await ReportService(session, ctx).lead_by_counselor(days=days)


@router.get("/academic/attendance", response_model=AttendanceSummaryResponse)
async def attendance_summary(
    days: int = Query(30, ge=1, le=365),
    ctx: TenantContext = Depends(require_permission("report.academic")),
    session: AsyncSession = Depends(get_session),
):
    return await ReportService(session, ctx).attendance_summary(days=days)


@router.get("/academic/class-fill", response_model=list[ClassFillItem])
async def class_fill(
    limit: int = Query(20, ge=1, le=100),
    ctx: TenantContext = Depends(require_permission("report.academic")),
    session: AsyncSession = Depends(get_session),
):
    return await ReportService(session, ctx).class_fill_rate(limit=limit)


@router.get("/academic/exam/{exam_id}", response_model=ExamDistributionResponse)
async def exam_distribution(
    exam_id: UUID,
    ctx: TenantContext = Depends(require_permission("report.academic")),
    session: AsyncSession = Depends(get_session),
):
    return await ReportService(session, ctx).exam_distribution(exam_id)


@router.get("/students/summary", response_model=StudentSummaryResponse)
async def student_summary(
    ctx: TenantContext = Depends(require_permission("report.dashboard")),
    session: AsyncSession = Depends(get_session),
):
    return await ReportService(session, ctx).student_summary()


@router.get("/tasks/summary", response_model=TaskSummaryResponse)
async def task_summary(
    ctx: TenantContext = Depends(require_permission("report.dashboard")),
    session: AsyncSession = Depends(get_session),
):
    return await ReportService(session, ctx).task_summary()