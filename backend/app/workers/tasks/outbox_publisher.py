from datetime import UTC, datetime, timedelta

from sqlalchemy import select, update

from app.core.database import SessionLocal
from app.events.outbox import OutboxEvent
from app.workers.celery_app import celery_app


@celery_app.task(name="app.workers.tasks.outbox_publisher.publish_pending")
def publish_pending(batch: int = 50) -> dict:
    import asyncio

    return asyncio.run(_publish_pending(batch))


async def _publish_pending(batch: int) -> dict:
    published = 0
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
            row.claimed_by = "outbox-publisher"
            await session.flush()
            try:
                # TODO: publish to Redis Streams
                row.status = "PUBLISHED"
                row.published_at = datetime.now(UTC)
                published += 1
            except Exception as e:
                row.attempt_count += 1
                row.last_error = str(e)
                if row.attempt_count >= row.max_attempts:
                    row.status = "DEAD"
                else:
                    row.status = "FAILED"
                    row.available_at = datetime.now(UTC) + timedelta(seconds=2 ** row.attempt_count)
                failed += 1
        await session.commit()
    return {"published": published, "failed": failed}