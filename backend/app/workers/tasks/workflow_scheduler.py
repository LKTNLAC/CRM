"""Celery beat task: chạy scheduled rules (enrollment expiring, lead no response).

Chạy mỗi giờ.
"""

import asyncio
from datetime import UTC, date, datetime, timedelta

from sqlalchemy import func, select

from app.core.database import SessionLocal
from app.core.tenant import TenantContext
from app.modules.enrollments.infrastructure.models import EnrollmentModel
from app.modules.leads.infrastructure.models import LeadActivityModel, LeadModel
from app.modules.workflows.application.engine import WorkflowEngine
from app.workers.celery_app import celery_app


@celery_app.task(name="app.workers.tasks.workflow_scheduler.run_scheduled")
def run_scheduled():
    return asyncio.run(_run())


async def _run() -> dict:
    result = {"enrollment_expiring": 0, "lead_no_response": 0}

    async with SessionLocal() as session:
        # 1. Enrollment expiring trong 14 ngày
        today = date.today()
        soon = today + timedelta(days=14)
        stmt = select(EnrollmentModel).where(
            EnrollmentModel.status == "ACTIVE",
            EnrollmentModel.end_date.isnot(None),
            EnrollmentModel.end_date <= soon,
            EnrollmentModel.end_date >= today,
        )
        enrollments = (await session.execute(stmt)).scalars().all()

        for e in enrollments:
            days_remaining = (e.end_date - today).days
            tenant = TenantContext(
                user_id=e.created_by or e.id,
                organization_id=e.organization_id,
                branch_id=e.branch_id,
                roles=[],
            )
            engine = WorkflowEngine(session, tenant)
            payload = {
                "enrollment_id": str(e.id),
                "student_id": str(e.student_id),
                "days_remaining": days_remaining,
                "organization_id": str(e.organization_id),
            }
            await engine.trigger("scheduled:enrollment_expiring", payload)
            result["enrollment_expiring"] += 1

        # 2. Lead no activity sau 3 ngày
        cutoff = datetime.now(UTC) - timedelta(days=3)
        stmt = select(LeadModel).where(
            LeadModel.status.in_(["NEW", "CONTACTED", "QUALIFIED"]),
        )
        leads = (await session.execute(stmt)).scalars().all()

        for lead in leads:
            last = (await session.execute(
                select(func.max(LeadActivityModel.created_at)).where(
                    LeadActivityModel.lead_id == lead.id
                )
            )).scalar_one_or_none()
            last_activity = last or lead.created_at
            if last_activity >= cutoff:
                continue

            days_since = (datetime.now(UTC) - last_activity).days
            tenant = TenantContext(
                user_id=lead.created_by or lead.id,
                organization_id=lead.organization_id,
                branch_id=lead.branch_id,
                roles=[],
            )
            engine = WorkflowEngine(session, tenant)
            payload = {
                "lead_id": str(lead.id),
                "counselor_id": str(lead.counselor_id) if lead.counselor_id else None,
                "days_since_last_activity": days_since,
                "organization_id": str(lead.organization_id),
            }
            await engine.trigger("scheduled:lead_no_response", payload)
            result["lead_no_response"] += 1

        await session.commit()

    return result