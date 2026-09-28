from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.tenant import TenantContext
from app.modules.tasks.infrastructure.models import TaskModel


class TaskRepository:
    def __init__(self, session: AsyncSession, tenant: TenantContext):
        self.session = session
        self.tenant = tenant

    def _base(self):
        return select(TaskModel).where(TaskModel.organization_id == self.tenant.organization_id)

    async def list(self, status: str | None = None, assignee_id: UUID | None = None, limit: int = 50, offset: int = 0):
        stmt = self._base()
        if status:
            stmt = stmt.where(TaskModel.status == status)
        if assignee_id:
            stmt = stmt.where(TaskModel.assignee_id == assignee_id)
        stmt = stmt.order_by(TaskModel.created_at.desc()).limit(limit).offset(offset)
        return (await self.session.execute(stmt)).scalars().all()

    async def get(self, task_id: UUID) -> TaskModel | None:
        stmt = self._base().where(TaskModel.id == task_id)
        return (await self.session.execute(stmt)).scalar_one_or_none()

    async def create(self, **kwargs) -> TaskModel:
        task = TaskModel(**kwargs)
        self.session.add(task)
        await self.session.flush()
        return task

    async def count(self) -> int:
        from sqlalchemy import func
        stmt = select(func.count()).select_from(TaskModel).where(TaskModel.organization_id == self.tenant.organization_id)
        return (await self.session.execute(stmt)).scalar_one()