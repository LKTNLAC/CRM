"""Celery task: gửi communication đang PENDING qua provider."""

import asyncio
from datetime import UTC, datetime

from sqlalchemy import select

from app.core.database import SessionLocal
from app.integrations.registry import get_registry
from app.modules.auth.infrastructure import models as _auth_models  # noqa
from app.modules.communications.infrastructure.models import CommunicationModel  # noqa
from app.modules.notifications.infrastructure import models as _notif_models  # noqa

from app.workers.celery_app import celery_app


@celery_app.task(name="app.workers.tasks.communication_sender.send_pending")
def send_pending(batch: int = 20):
    return asyncio.run(_send(batch))


async def _send(batch: int) -> dict:
    sent = 0
    failed = 0
    registry = get_registry()

    async with SessionLocal() as session:
        stmt = (
            select(CommunicationModel)
            .where(CommunicationModel.status == "PENDING")
            .order_by(CommunicationModel.created_at)
            .limit(batch)
        )
        rows = (await session.execute(stmt)).scalars().all()

        for row in rows:
            provider = registry.get_communication(row.channel)
            result = await provider.send(
                recipient=row.recipient,
                body=row.body,
                subject=row.subject,
                meta=row.meta or {},
            )
            if result.success:
                row.status = "SENT"
                row.provider = provider.name
                row.provider_message_id = result.provider_message_id
                row.sent_at = datetime.now(UTC)
                sent += 1
            else:
                row.status = "FAILED"
                row.provider = provider.name
                row.error = result.error
                failed += 1

        await session.commit()

    return {"sent": sent, "failed": failed}