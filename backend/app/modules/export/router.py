"""Export endpoints — Excel & PDF."""

from datetime import UTC, datetime
from uuid import UUID

from fastapi import APIRouter, Depends, Query
from fastapi.responses import StreamingResponse
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_session
from app.core.dependencies import require_permission
from app.core.tenant import TenantContext
from app.modules.attendance.infrastructure.models import AttendanceModel
from app.modules.classes.infrastructure.models import ClassModel
from app.modules.enrollments.infrastructure.models import EnrollmentModel
from app.modules.examinations.infrastructure.models import ExamModel, ExamResultModel
from app.modules.export.application.excel import export_to_excel
from app.modules.export.application.pdf import export_to_pdf
from app.modules.leads.infrastructure.models import LeadModel
from app.modules.students.infrastructure.models import StudentModel

router = APIRouter(prefix="/export", tags=["export"])


def _excel_response(data, filename: str) -> StreamingResponse:
    return StreamingResponse(
        data,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


def _pdf_response(data, filename: str) -> StreamingResponse:
    return StreamingResponse(
        data,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


def _timestamp() -> str:
    return datetime.now(UTC).strftime("%Y%m%d_%H%M%S")


# ============ STUDENTS ============

@router.get("/students")
async def export_students(
    format: str = Query("xlsx", pattern="^(xlsx|pdf)$"),
    ctx: TenantContext = Depends(require_permission("student.read")),
    session: AsyncSession = Depends(get_session),
):
    stmt = (
        select(StudentModel)
        .where(
            StudentModel.organization_id == ctx.organization_id,
            StudentModel.deleted_at.is_(None),
        )
        .order_by(StudentModel.created_at.desc())
        .limit(5000)
    )
    students = (await session.execute(stmt)).scalars().all()

    headers = ["Mã HV", "Họ tên", "Email", "Điện thoại", "Ngày sinh", "Giới tính", "Trạng thái"]
    rows = [
        [
            s.student_code,
            s.full_name,
            s.email or "",
            s.phone or "",
            s.date_of_birth.isoformat() if s.date_of_birth else "",
            s.gender or "",
            s.status,
        ]
        for s in students
    ]

    if format == "xlsx":
        data = export_to_excel("Học viên", headers, rows)
        return _excel_response(data, f"students_{_timestamp()}.xlsx")
    data = export_to_pdf("Danh sách học viên", headers, rows, f"Tổng: {len(rows)}")
    return _pdf_response(data, f"students_{_timestamp()}.pdf")


# ============ LEADS ============

@router.get("/leads")
async def export_leads(
    format: str = Query("xlsx", pattern="^(xlsx|pdf)$"),
    ctx: TenantContext = Depends(require_permission("lead.read")),
    session: AsyncSession = Depends(get_session),
):
    stmt = (
        select(LeadModel)
        .where(LeadModel.organization_id == ctx.organization_id)
        .order_by(LeadModel.created_at.desc())
        .limit(5000)
    )
    leads = (await session.execute(stmt)).scalars().all()

    headers = ["Họ tên", "Email", "Điện thoại", "Nguồn", "Trạng thái", "Điểm", "Ngày tạo"]
    rows = [
        [
            l.full_name,
            l.email or "",
            l.phone or "",
            l.source or "",
            l.status,
            l.score,
            l.created_at.strftime("%d/%m/%Y") if l.created_at else "",
        ]
        for l in leads
    ]

    if format == "xlsx":
        data = export_to_excel("Leads", headers, rows)
        return _excel_response(data, f"leads_{_timestamp()}.xlsx")
    data = export_to_pdf("Danh sách leads", headers, rows, f"Tổng: {len(rows)}")
    return _pdf_response(data, f"leads_{_timestamp()}.pdf")


# ============ ENROLLMENTS ============

@router.get("/enrollments")
async def export_enrollments(
    format: str = Query("xlsx", pattern="^(xlsx|pdf)$"),
    ctx: TenantContext = Depends(require_permission("enrollment.read")),
    session: AsyncSession = Depends(get_session),
):
    stmt = (
        select(EnrollmentModel, StudentModel)
        .join(StudentModel, StudentModel.id == EnrollmentModel.student_id)
        .where(EnrollmentModel.organization_id == ctx.organization_id)
        .order_by(EnrollmentModel.created_at.desc())
        .limit(5000)
    )
    rows_db = (await session.execute(stmt)).all()

    headers = ["Mã HV", "Học viên", "Trạng thái", "Bắt đầu", "Kết thúc"]
    rows = [
        [
            s.student_code,
            s.full_name,
            e.status,
            e.start_date.isoformat() if e.start_date else "",
            e.end_date.isoformat() if e.end_date else "",
        ]
        for e, s in rows_db
    ]

    if format == "xlsx":
        data = export_to_excel("Ghi danh", headers, rows)
        return _excel_response(data, f"enrollments_{_timestamp()}.xlsx")
    data = export_to_pdf("Danh sách ghi danh", headers, rows, f"Tổng: {len(rows)}")
    return _pdf_response(data, f"enrollments_{_timestamp()}.pdf")


# ============ ATTENDANCE ============

@router.get("/attendance")
async def export_attendance(
    class_id: UUID = Query(...),
    format: str = Query("xlsx", pattern="^(xlsx|pdf)$"),
    ctx: TenantContext = Depends(require_permission("attendance.read")),
    session: AsyncSession = Depends(get_session),
):
    # Verify class thuộc tenant
    cls = (
        await session.execute(
            select(ClassModel).where(
                ClassModel.id == class_id,
                ClassModel.organization_id == ctx.organization_id,
            )
        )
    ).scalar_one_or_none()
    if not cls:
        from app.core.errors import NotFoundError

        raise NotFoundError("Class not found")

    stmt = (
        select(AttendanceModel, StudentModel)
        .join(StudentModel, StudentModel.id == AttendanceModel.student_id)
        .where(AttendanceModel.class_id == class_id)
        .order_by(AttendanceModel.session_date.desc(), StudentModel.full_name)
        .limit(10000)
    )
    rows_db = (await session.execute(stmt)).all()

    headers = ["Ngày", "Mã HV", "Học viên", "Trạng thái", "Ghi chú"]
    rows = [
        [
            a.session_date.isoformat() if a.session_date else "",
            s.student_code,
            s.full_name,
            a.status,
            a.note or "",
        ]
        for a, s in rows_db
    ]

    title = f"Điểm danh — {cls.code} {cls.name}"
    if format == "xlsx":
        data = export_to_excel("Điểm danh", headers, rows)
        return _excel_response(data, f"attendance_{cls.code}_{_timestamp()}.xlsx")
    data = export_to_pdf(title, headers, rows, f"Tổng: {len(rows)}")
    return _pdf_response(data, f"attendance_{cls.code}_{_timestamp()}.pdf")


# ============ EXAM RESULTS ============

@router.get("/exam-results")
async def export_exam_results(
    exam_id: UUID = Query(...),
    format: str = Query("xlsx", pattern="^(xlsx|pdf)$"),
    ctx: TenantContext = Depends(require_permission("exam_result.read")),
    session: AsyncSession = Depends(get_session),
):
    exam = (
        await session.execute(
            select(ExamModel).where(
                ExamModel.id == exam_id,
                ExamModel.organization_id == ctx.organization_id,
            )
        )
    ).scalar_one_or_none()
    if not exam:
        from app.core.errors import NotFoundError

        raise NotFoundError("Exam not found")

    stmt = (
        select(ExamResultModel, StudentModel)
        .join(StudentModel, StudentModel.id == ExamResultModel.student_id)
        .where(ExamResultModel.exam_id == exam_id)
        .order_by(StudentModel.full_name)
    )
    rows_db = (await session.execute(stmt)).all()

    headers = ["Mã HV", "Học viên", "Điểm", "Xếp loại", "Nhận xét"]
    rows = [
        [
            s.student_code,
            s.full_name,
            float(r.score),
            r.grade or "",
            r.feedback or "",
        ]
        for r, s in rows_db
    ]

    title = f"Kết quả — {exam.name}"
    if format == "xlsx":
        data = export_to_excel("Kết quả", headers, rows)
        return _excel_response(data, f"exam_{exam.name}_{_timestamp()}.xlsx")
    data = export_to_pdf(title, headers, rows, f"Tổng: {len(rows)}")
    return _pdf_response(data, f"exam_{exam.name}_{_timestamp()}.pdf")