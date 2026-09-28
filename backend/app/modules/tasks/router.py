from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_session
from app.core.dependencies import get_tenant_context, require_permission
from app.core.tenant import TenantContext
from app.modules.tasks.application.services import TaskService
from app.modules.tasks.schemas import TaskCreate, TaskResponse, TaskUpdate

router = APIRouter(prefix="/tasks", tags=["tasks"])


@router.get("", response_model=list[TaskResponse])
async def list_tasks(
    status: str | None = Query(None),
    assignee_id: UUID | None = Query(None),
    limit: int = Query(50, le=200),
    offset: int = Query(0, ge=0),
    ctx: TenantContext = Depends(require_permission("task.read")),
    session: AsyncSession = Depends(get_session),
):
    svc = TaskService(session, ctx)
    return await svc.list(status=status, assignee_id=assignee_id, limit=limit, offset=offset)


@router.post("", response_model=TaskResponse, status_code=201)
async def create_task(
    body: TaskCreate,
    ctx: TenantContext = Depends(require_permission("task.create")),
    session: AsyncSession = Depends(get_session),
):
    svc = TaskService(session, ctx)
    return await svc.create(body.model_dump())


@router.get("/{task_id}", response_model=TaskResponse)
async def get_task(
    task_id: UUID,
    ctx: TenantContext = Depends(require_permission("task.read")),
    session: AsyncSession = Depends(get_session),
):
    svc = TaskService(session, ctx)
    return await svc.get(task_id)


@router.patch("/{task_id}", response_model=TaskResponse)
async def update_task(
    task_id: UUID,
    body: TaskUpdate,
    ctx: TenantContext = Depends(require_permission("task.update")),
    session: AsyncSession = Depends(get_session),
):
    svc = TaskService(session, ctx)
    return await svc.update(task_id, body.model_dump(exclude_none=True))