"""Đảm bảo predefined workflows tồn tại trong DB."""

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.workflows.domain.rules import PREDEFINED_RULES
from app.modules.workflows.infrastructure.models import WorkflowModel


async def ensure_predefined_workflows(session: AsyncSession, organization_id) -> None:
    for rule in PREDEFINED_RULES:
        existing = (await session.execute(
            select(WorkflowModel).where(
                WorkflowModel.organization_id == organization_id,
                WorkflowModel.code == rule["code"],
            )
        )).scalar_one_or_none()
        if not existing:
            wf = WorkflowModel(
                organization_id=organization_id,
                code=rule["code"],
                name=rule["name"],
                trigger_event=rule["trigger_event"],
                is_enabled=True,
                config={
                    "condition": rule["condition"],
                    "actions": rule["actions"],
                    **rule["config"],
                },
            )
            session.add(wf)
    await session.commit()
