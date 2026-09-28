from datetime import UTC, datetime
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.tenant import TenantContext
from app.modules.workflows.application.actions import ACTIONS
from app.modules.workflows.application.conditions import evaluate
from app.modules.workflows.infrastructure.models import (
    WorkflowExecutionModel,
    WorkflowModel,
)


class WorkflowEngine:
    def __init__(self, session: AsyncSession, tenant: TenantContext):
        self.session = session
        self.tenant = tenant

    async def trigger(self, event_type: str, payload: dict, event_id: UUID | None = None) -> list[dict]:
        stmt = select(WorkflowModel).where(
            WorkflowModel.organization_id == self.tenant.organization_id,
            WorkflowModel.trigger_event == event_type,
            WorkflowModel.is_enabled == True,  # noqa: E712
        )
        workflows = (await self.session.execute(stmt)).scalars().all()
        results = []
        for wf in workflows:
            result = await self._run(wf, payload, event_id)
            results.append(result)
        return results

    async def _run(self, wf: WorkflowModel, payload: dict, event_id: UUID | None) -> dict:
        execution = WorkflowExecutionModel(
            workflow_id=wf.id,
            event_id=event_id,
            event_type=wf.trigger_event,
            payload=payload,
            status="PENDING",
        )
        self.session.add(execution)
        await self.session.flush()

        config = wf.config or {}
        condition_name = config.get("condition")

        if condition_name:
            if not evaluate(condition_name, payload, config):
                execution.status = "SUCCESS"
                execution.actions_log = {"skipped": "condition_false"}
                execution.finished_at = datetime.now(UTC)
                await self.session.commit()
                return {"workflow_id": str(wf.id), "status": "skipped"}

        action_names = config.get("actions", [])
        log = {}
        try:
            for action_name in action_names:
                fn = ACTIONS.get(action_name)
                if not fn:
                    log[action_name] = {"error": "unknown_action"}
                    continue
                try:
                    log[action_name] = await fn(self.session, self.tenant, payload, config)
                except Exception as e:
                    log[action_name] = {"error": str(e)}

            execution.status = "SUCCESS"
            execution.actions_log = log
            execution.finished_at = datetime.now(UTC)
            await self.session.commit()
            return {"workflow_id": str(wf.id), "status": "success", "actions": log}

        except Exception as e:
            execution.status = "FAILED"
            execution.attempt_count += 1
            execution.error = str(e)
            execution.actions_log = log
            execution.finished_at = datetime.now(UTC)
            await self.session.commit()
            return {"workflow_id": str(wf.id), "status": "failed", "error": str(e)}
