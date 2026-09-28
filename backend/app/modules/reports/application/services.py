"""Report service — read-only aggregation.

Mọi query đều filter theo tenant + data scope của user.
"""

from datetime import UTC, date, datetime, timedelta
from uuid import UUID

from sqlalchemy import case, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.tenant import TenantContext
from app.modules.attendance.infrastructure.models import AttendanceModel
from app.modules.classes.infrastructure.models import ClassModel
from app.modules.enrollments.infrastructure.models import (
    EnrollmentClassModel,
    EnrollmentModel,
)
from app.modules.examinations.infrastructure.models import ExamModel, ExamResultModel
from app.modules.leads.infrastructure.models import LeadActivityModel, LeadModel
from app.modules.students.infrastructure.models import StudentModel
from app.modules.tasks.infrastructure.models import TaskModel


class ReportService:
    def __init__(self, session: AsyncSession, tenant: TenantContext):
        self.session = session
        self.tenant = tenant

    # ============ DASHBOARD ============

    async def dashboard(self) -> dict:
        org_id = self.tenant.organization_id
        today = date.today()
        last_30 = today - timedelta(days=30)

        # Counts cơ bản
        total_leads = (await self.session.execute(
            select(func.count()).select_from(LeadModel).where(LeadModel.organization_id == org_id)
        )).scalar_one()

        new_leads_30d = (await self.session.execute(
            select(func.count()).select_from(LeadModel).where(
                LeadModel.organization_id == org_id,
                LeadModel.created_at >= last_30,
            )
        )).scalar_one()

        active_students = (await self.session.execute(
            select(func.count()).select_from(StudentModel).where(
                StudentModel.organization_id == org_id,
                StudentModel.status == "ACTIVE",
                StudentModel.deleted_at.is_(None),
            )
        )).scalar_one()

        active_classes = (await self.session.execute(
            select(func.count()).select_from(ClassModel).where(
                ClassModel.organization_id == org_id,
                ClassModel.status.in_(["OPEN", "ACTIVE"]),
                ClassModel.deleted_at.is_(None),
            )
        )).scalar_one()

        open_tasks = (await self.session.execute(
            select(func.count()).select_from(TaskModel).where(
                TaskModel.organization_id == org_id,
                TaskModel.status.in_(["OPEN", "IN_PROGRESS"]),
                TaskModel.assignee_id == self.tenant.user_id,
            )
        )).scalar_one()

        return {
            "total_leads": total_leads,
            "new_leads_30d": new_leads_30d,
            "active_students": active_students,
            "active_classes": active_classes,
            "my_open_tasks": open_tasks,
        }

    # ============ SALES ============

    async def lead_funnel(self, days: int = 30) -> dict:
        org_id = self.tenant.organization_id
        since = datetime.now(UTC) - timedelta(days=days)

        stmt = (
            select(LeadModel.status, func.count())
            .where(
                LeadModel.organization_id == org_id,
                LeadModel.created_at >= since,
            )
            .group_by(LeadModel.status)
        )
        rows = (await self.session.execute(stmt)).all()
        by_status = {status: count for status, count in rows}

        total = sum(by_status.values())
        enrolled = by_status.get("ENROLLED", 0)
        conversion_rate = (enrolled / total * 100) if total else 0.0

        return {
            "period_days": days,
            "total": total,
            "by_status": by_status,
            "enrolled": enrolled,
            "conversion_rate": round(conversion_rate, 2),
        }

    async def lead_by_source(self, days: int = 30) -> list[dict]:
        org_id = self.tenant.organization_id
        since = datetime.now(UTC) - timedelta(days=days)

        stmt = (
            select(
                LeadModel.source,
                func.count().label("total"),
                func.sum(case((LeadModel.status == "ENROLLED", 1), else_=0)).label("enrolled"),
            )
            .where(
                LeadModel.organization_id == org_id,
                LeadModel.created_at >= since,
            )
            .group_by(LeadModel.source)
        )
        rows = (await self.session.execute(stmt)).all()
        result = []
        for source, total, enrolled in rows:
            result.append({
                "source": source or "unknown",
                "total": total,
                "enrolled": enrolled or 0,
                "conversion_rate": round((enrolled or 0) / total * 100, 2) if total else 0.0,
            })
        return result

    async def lead_by_counselor(self, days: int = 30) -> list[dict]:
        org_id = self.tenant.organization_id
        since = datetime.now(UTC) - timedelta(days=days)

        stmt = (
            select(
                LeadModel.counselor_id,
                func.count().label("total"),
                func.sum(case((LeadModel.status == "ENROLLED", 1), else_=0)).label("enrolled"),
            )
            .where(
                LeadModel.organization_id == org_id,
                LeadModel.created_at >= since,
                LeadModel.counselor_id.isnot(None),
            )
            .group_by(LeadModel.counselor_id)
        )
        rows = (await self.session.execute(stmt)).all()
        return [
            {
                "counselor_id": str(cid),
                "total": total,
                "enrolled": enrolled or 0,
                "conversion_rate": round((enrolled or 0) / total * 100, 2) if total else 0.0,
            }
            for cid, total, enrolled in rows
        ]

    # ============ ACADEMIC ============

    async def attendance_summary(self, days: int = 30) -> dict:
        org_id = self.tenant.organization_id
        since = date.today() - timedelta(days=days)

        stmt = (
            select(AttendanceModel.status, func.count())
            .where(
                AttendanceModel.organization_id == org_id,
                AttendanceModel.session_date >= since,
            )
            .group_by(AttendanceModel.status)
        )
        rows = (await self.session.execute(stmt)).all()
        by_status = {status: count for status, count in rows}
        total = sum(by_status.values())

        present = by_status.get("PRESENT", 0) + by_status.get("LATE", 0)
        attendance_rate = (present / total * 100) if total else 0.0

        return {
            "period_days": days,
            "total_sessions": total,
            "by_status": by_status,
            "attendance_rate": round(attendance_rate, 2),
        }

    async def class_fill_rate(self, limit: int = 20) -> list[dict]:
        org_id = self.tenant.organization_id

        # Count học viên ACTIVE cho mỗi class
        stmt = (
            select(
                ClassModel.id,
                ClassModel.code,
                ClassModel.name,
                ClassModel.capacity,
                func.count(EnrollmentClassModel.id).label("enrolled"),
            )
            .outerjoin(
                EnrollmentClassModel,
                (EnrollmentClassModel.class_id == ClassModel.id)
                & (EnrollmentClassModel.status == "ACTIVE"),
            )
            .where(
                ClassModel.organization_id == org_id,
                ClassModel.deleted_at.is_(None),
                ClassModel.status.in_(["OPEN", "ACTIVE"]),
            )
            .group_by(ClassModel.id, ClassModel.code, ClassModel.name, ClassModel.capacity)
            .limit(limit)
        )
        rows = (await self.session.execute(stmt)).all()
        return [
            {
                "class_id": str(cid),
                "code": code,
                "name": name,
                "capacity": capacity,
                "enrolled": enrolled,
                "fill_rate": round(enrolled / capacity * 100, 2) if capacity else 0.0,
            }
            for cid, code, name, capacity, enrolled in rows
        ]

    async def exam_distribution(self, exam_id: UUID) -> dict:
        # Verify exam thuộc tenant
        exam = (await self.session.execute(
            select(ExamModel).where(
                ExamModel.id == exam_id,
                ExamModel.organization_id == self.tenant.organization_id,
            )
        )).scalar_one_or_none()
        if not exam:
            return {"error": "Exam not found"}

        stmt = (
            select(ExamResultModel.score)
            .where(ExamResultModel.exam_id == exam_id)
        )
        scores = [float(s) for (s,) in (await self.session.execute(stmt)).all()]
        if not scores:
            return {"exam_id": str(exam_id), "count": 0}

        scores_sorted = sorted(scores)
        n = len(scores_sorted)
        avg = sum(scores) / n
        median = scores_sorted[n // 2] if n % 2 else (scores_sorted[n // 2 - 1] + scores_sorted[n // 2]) / 2

        return {
            "exam_id": str(exam_id),
            "exam_name": exam.name,
            "max_score": float(exam.max_score),
            "count": n,
            "avg": round(avg, 2),
            "min": min(scores),
            "max": max(scores),
            "median": round(median, 2),
            "buckets": {
                "<50": sum(1 for s in scores if s < 50),
                "50-69": sum(1 for s in scores if 50 <= s < 70),
                "70-84": sum(1 for s in scores if 70 <= s < 85),
                "85-100": sum(1 for s in scores if s >= 85),
            },
        }

    # ============ STUDENT ============

    async def student_summary(self) -> dict:
        org_id = self.tenant.organization_id

        stmt = (
            select(StudentModel.status, func.count())
            .where(
                StudentModel.organization_id == org_id,
                StudentModel.deleted_at.is_(None),
            )
            .group_by(StudentModel.status)
        )
        rows = (await self.session.execute(stmt)).all()
        by_status = {status: count for status, count in rows}

        # New students trong 30 ngày
        since = datetime.now(UTC) - timedelta(days=30)
        new_30d = (await self.session.execute(
            select(func.count()).select_from(StudentModel).where(
                StudentModel.organization_id == org_id,
                StudentModel.created_at >= since,
                StudentModel.deleted_at.is_(None),
            )
        )).scalar_one()

        return {
            "by_status": by_status,
            "total": sum(by_status.values()),
            "new_30d": new_30d,
        }

    # ============ TASK ============

    async def task_summary(self) -> dict:
        org_id = self.tenant.organization_id
        now = datetime.now(UTC)

        stmt = (
            select(TaskModel.status, func.count())
            .where(
                TaskModel.organization_id == org_id,
                TaskModel.assignee_id == self.tenant.user_id,
            )
            .group_by(TaskModel.status)
        )
        rows = (await self.session.execute(stmt)).all()
        by_status = {status: count for status, count in rows}

        overdue = (await self.session.execute(
            select(func.count()).select_from(TaskModel).where(
                TaskModel.organization_id == org_id,
                TaskModel.assignee_id == self.tenant.user_id,
                TaskModel.status.in_(["OPEN", "IN_PROGRESS"]),
                TaskModel.due_at.isnot(None),
                TaskModel.due_at < now,
            )
        )).scalar_one()

        return {
            "by_status": by_status,
            "total": sum(by_status.values()),
            "overdue": overdue,
        }