from datetime import UTC, datetime
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.errors import ForbiddenError, NotFoundError
from app.core.tenant import TenantContext
from app.events.envelope import EventEnvelope
from app.events.outbox import OutboxEvent
from app.modules.tasks.domain.events import TASK_CANCELLED, TASK_COMPLETED, TASK_CREATED
from app.modules.tasks.infrastructure.models import TaskModel
from app.modules.tasks.infrastructure.repository import TaskRepository


class TaskService:
    def __init__(self, session: AsyncSession, tenant: TenantContext):
        self.session = session
        self.tenant = tenant
        self.repo = TaskRepository(session, tenant)

    async def list(self, status: str | None = None, assignee_id: UUID | None = None, limit: int = 50, offset: int = 0):
        return await self.repo.list(status=status, assignee_id=assignee_id, limit=limit, offset=offset)

    async def get(self, task_id: UUID) -> TaskModel:
        task = await self.repo.get(task_id)
        if not task:
            raise NotFoundError("Task not found")
        return task

    async def create(self, data: dict) -> TaskModel:
        data["organization_id"] = self.tenant.organization_id
        data["branch_id"] = self.tenant.branch_id
        data["created_by"] = self.tenant.user_id
        task = await self.repo.create(**data)
        await self._emit(TASK_CREATED, task)
        await self.session.commit()
        return task

    async def update(self, task_id: UUID, data: dict) -> TaskModel:
        task = await self.get(task_id)

        # Chỉ assignee hoặc SUPER_ADMIN/SCHOOL_ADMIN được update
        if task.assignee_id != self.tenant.user_id and not any(
            r in self.tenant.roles for r in ("SUPER_ADMIN", "SCHOOL_ADMIN")
        ):
            raise ForbiddenError("Not allowed to update this task")

        for k, v in data.items():
            if v is not None:
                setattr(task, k, v)

        if data.get("status") == "DONE" and not task.completed_at:
            task.completed_at = datetime.now(UTC)
            await self._emit(TASK_COMPLETED, task)
        elif data.get("status") == "CANCELLED":
            await self._emit(TASK_CANCELLED, task)

        await self.session.commit()
        return task

    async def _emit(self, event_type: str, task: TaskModel) -> None:
        env = EventEnvelope.create(
            event_type=event_type,
            aggregate_type="Task",
            aggregate_id=task.id,
            payload={
                "task_id": str(task.id),
                "task_type": task.task_type,
                "status": task.status,
                "assignee_id": str(task.assignee_id),
                "related_type": task.related_type,
                "related_id": str(task.related_id) if task.related_id else None,
                "organization_id": str(task.organization_id),
            },
            source="tasks-module",
        )
        self.session.add(OutboxEvent(
            event_id=env.event_id,
            event_type=env.event_type,
            aggregate_type=env.aggregate_type,
            aggregate_id=env.aggregate_id,
            payload=env.payload,
        ))