from datetime import date
from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_session
from app.core.dependencies import require_permission
from app.core.tenant import TenantContext
from app.modules.attendance.application.services import AttendanceService
from app.modules.attendance.schemas import (
    AttendanceBulkRecord,
    AttendanceCorrection,
    AttendanceRecord,
    AttendanceResponse,
)

router = APIRouter(prefix="/attendance", tags=["attendance"])


@router.post("", response_model=AttendanceResponse, status_code=201)
async def record_attendance(
    body: AttendanceRecord,
    ctx: TenantContext = Depends(require_permission("attendance.create")),
    session: AsyncSession = Depends(get_session),
):
    return await AttendanceService(session, ctx).record(body.model_dump())


@router.post("/bulk")
async def bulk_record(
    body: AttendanceBulkRecord,
    ctx: TenantContext = Depends(require_permission("attendance.create")),
    session: AsyncSession = Depends(get_session),
):
    records = await AttendanceService(session, ctx).bulk_record(body.class_id, body.session_date, body.records)
    return {"created": len(records)}


@router.post("/{attendance_id}/correct", response_model=AttendanceResponse)
async def correct_attendance(
    attendance_id: UUID,
    body: AttendanceCorrection,
    ctx: TenantContext = Depends(require_permission("attendance.update")),
    session: AsyncSession = Depends(get_session),
):
    return await AttendanceService(session, ctx).correct(attendance_id, body.new_status, body.reason)


@router.get("", response_model=list[AttendanceResponse])
async def list_attendance(
    class_id: UUID | None = Query(None),
    student_id: UUID | None = Query(None),
    session_date: date | None = Query(None),
    limit: int = Query(200, le=500),
    offset: int = Query(0, ge=0),
    ctx: TenantContext = Depends(require_permission("attendance.read")),
    session: AsyncSession = Depends(get_session),
):
    svc = AttendanceService(session, ctx)
    if class_id:
        return await svc.list_by_class(class_id, session_date=session_date, limit=limit, offset=offset)
    if student_id:
        return await svc.list_by_student(student_id, limit=limit, offset=offset)
    return []