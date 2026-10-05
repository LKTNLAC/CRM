"""Celery task: consume outbox events và trigger workflows.

Chạy định kỳ mỗi 5 giây (qua Celery beat).
"""

import asyncio
from datetime import UTC, datetime
from uuid import UUID

from sqlalchemy import select

from app.core.database import SessionLocal
from app.core.tenant import TenantContext
from app.events.outbox import OutboxEvent
from app.modules.workflows.application.engine import WorkflowEngine
from app.workers.celery_app import celery_app

# Ensure all models are loaded so SQLAlchemy can resolve FKs
from app.modules.auth.infrastructure import models as _auth_models  # noqa: F401
from app.modules.students.infrastructure import models as _student_models  # noqa: F401
from app.modules.tasks.infrastructure import models as _task_models  # noqa: F401
from app.modules.notifications.infrastructure import models as _notif_models  # noqa: F401
from app.modules.communications.infrastructure import models as _comm_models  # noqa: F401
from app.modules.leads.infrastructure import models as _lead_models  # noqa: F401
from app.modules.guardians.infrastructure import models as _guardian_models  # noqa: F401
from app.modules.courses.infrastructure import models as _course_models  # noqa: F401
from app.modules.classes.infrastructure import models as _class_models  # noqa: F401
from app.modules.enrollments.infrastructure import models as _enroll_models  # noqa: F401
from app.modules.attendance.infrastructure import models as _att_models  # noqa: F401
from app.modules.examinations.infrastructure import models as _exam_models  # noqa: F401
from app.modules.workflows.infrastructure import models as _wf_models  # noqa: F401
from app.modules.audit.infrastructure import models as _audit_models  # noqa: F401


@celery_app.task(name="app.workers.tasks.event_consumer.consume_pending")
def consume_pending(batch: int = 20):
    return asyncio.run(_consume(batch))


async def _consume(batch: int) -> dict:
    processed = 0
    failed = 0

    async with SessionLocal() as session:
        stmt = (
            select(OutboxEvent)
            .where(
                OutboxEvent.status == "PENDING",
                OutboxEvent.available_at <= datetime.now(UTC),
            )
            .order_by(OutboxEvent.created_at)
            .limit(batch)
            .with_for_update(skip_locked=True)
        )
        rows = (await session.execute(stmt)).scalars().all()

        for row in rows:
            row.status = "PROCESSING"
            row.claimed_at = datetime.now(UTC)
            row.claimed_by = "event-consumer"
            await session.flush()

            try:
                payload = row.payload or {}
                org_id = payload.get("organization_id")
                if not org_id:
                    row.status = "PUBLISHED"
                    row.published_at = datetime.now(UTC)
                    processed += 1
                    continue

                # Fallback user_id: counselor_id > assignee_id > created_by > admin đầu tiên
                fallback_user_id = (
                    payload.get("counselor_id")
                    or payload.get("assignee_id")
                    or payload.get("created_by")
                )

                if not fallback_user_id:
                    from app.modules.auth.infrastructure.models import User

                    admin_id = (
                        await session.execute(
                            select(User.id)
                            .where(
                                User.organization_id == UUID(str(org_id)),
                                User.deleted_at.is_(None),
                            )
                            .limit(1)
                        )
                    ).scalar_one_or_none()
                    fallback_user_id = str(admin_id) if admin_id else None

                if not fallback_user_id:
                    raise RuntimeError("No user found for tenant context")

                tenant = TenantContext(
                    user_id=UUID(str(fallback_user_id)),
                    organization_id=UUID(str(org_id)),
                    branch_id=None,
                    roles=["SUPER_ADMIN"],
                )
                engine = WorkflowEngine(session, tenant)
                await engine.trigger(row.event_type, payload, event_id=row.event_id)

                row.status = "PUBLISHED"
                row.published_at = datetime.now(UTC)
                processed += 1

            except Exception as e:
                row.attempt_count += 1
                row.last_error = str(e)
                if row.attempt_count >= row.max_attempts:
                    row.status = "DEAD"
                else:
                    row.status = "FAILED"
                failed += 1

        await session.commit()

    return {"processed": processed, "failed": failed}