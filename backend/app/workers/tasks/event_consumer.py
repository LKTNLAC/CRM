"""Celery task: consume outbox events và trigger workflows.

Chạy định kỳ mỗi 5 giây (qua Celery beat).
"""

import asyncio
from datetime import UTC, datetime

from sqlalchemy import select

from app.core.database import SessionLocal
from app.core.tenant import TenantContext
from app.events.outbox import OutboxEvent
from app.modules.workflows.application.engine import WorkflowEngine
from app.workers.celery_app import celery_app


@celery_app.task(name="app.workers.tasks.event_consumer.consume_pending")
def consume_pending(batch: int = 20):
    return asyncio.run(_consume(batch))


async def _consume(batch: int) -> dict:
    processed = 0
    failed = 0

    async with SessionLocal() as session:
        stmt = (
            select(OutboxEvent)
            .where(OutboxEvent.status == "PENDING", OutboxEvent.available_at <= datetime.now(UTC))
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
                # Giả lập: cần tenant context từ event payload
                # Trong thực tế, payload phải chứa org_id
                org_id = row.payload.get("organization_id")
                user_id = row.payload.get("user_id")
                if not org_id:
                    row.status = "PUBLISHED"
                    row.published_at = datetime.now(UTC)
                    processed += 1
                    continue

                from uuid import UUID
                tenant = TenantContext(
                    user_id=UUID(user_id) if user_id else UUID(int=0),
                    organization_id=UUID(org_id),
                    branch_id=None,
                    roles=[],
                )
                engine = WorkflowEngine(session, tenant)
                await engine.trigger(row.event_type, row.payload, event_id=row.event_id)

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