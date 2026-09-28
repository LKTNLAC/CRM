"""Action executors."""

from datetime import UTC, datetime, timedelta
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.tenant import TenantContext
from app.modules.communications.application.services import CommunicationService
from app.modules.notifications.application.services import NotificationService
from app.modules.tasks.application.services import TaskService


async def create_task(session: AsyncSession, tenant: TenantContext, payload: dict, config: dict) -> dict:
    svc = TaskService(session, tenant)
    assignee_id = config.get("assignee_id") or payload.get("counselor_id")
    if not assignee_id:
        return {"skipped": "no_assignee"}

    task = await svc.create({
        "task_type": config.get("task_type", "FOLLOW_UP"),
        "title": config.get("title", "Auto task"),
        "description": config.get("description"),
        "assignee_id": UUID(assignee_id) if isinstance(assignee_id, str) else assignee_id,
        "related_type": payload.get("aggregate_type"),
        "related_id": UUID(payload["aggregate_id"]) if payload.get("aggregate_id") else None,
        "priority": config.get("priority", "NORMAL"),
        "due_at": datetime.now(UTC) + timedelta(days=config.get("due_days", 1)),
    })
    return {"task_id": str(task.id)}


async def notify_counselor(session: AsyncSession, tenant: TenantContext, payload: dict, config: dict) -> dict:
    svc = NotificationService(session, tenant)
    user_id = config.get("user_id") or payload.get("counselor_id")
    if not user_id:
        return {"skipped": "no_counselor"}

    n = await svc.send(
        user_id=UUID(user_id) if isinstance(user_id, str) else user_id,
        notification_type=config.get("notification_type", "WORKFLOW_ALERT"),
        title=config.get("title", "Workflow alert"),
        body=config.get("body"),
        related_type=payload.get("aggregate_type"),
        related_id=UUID(payload["aggregate_id"]) if payload.get("aggregate_id") else None,
    )
    await session.commit()
    return {"notification_id": str(n.id)}


async def send_notification(session: AsyncSession, tenant: TenantContext, payload: dict, config: dict) -> dict:
    return await notify_counselor(session, tenant, payload, config)


async def send_communication(session: AsyncSession, tenant: TenantContext, payload: dict, config: dict) -> dict:
    svc = CommunicationService(session, tenant)
    channel = config.get("channel", "EMAIL")
    recipient = config.get("recipient") or payload.get("recipient")
    if not recipient:
        return {"skipped": "no_recipient"}

    c = await svc.create(
        channel=channel,
        recipient=recipient,
        subject=config.get("subject"),
        body=config.get("body", "Auto message"),
        related_type=payload.get("aggregate_type"),
        related_id=UUID(payload["aggregate_id"]) if payload.get("aggregate_id") else None,
    )
    return {"communication_id": str(c.id)}


ACTIONS = {
    "create_task": create_task,
    "notify_counselor": notify_counselor,
    "send_notification": send_notification,
    "send_communication": send_communication,
}
