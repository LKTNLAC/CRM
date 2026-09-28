from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_session
from app.core.dependencies import require_permission
from app.core.tenant import TenantContext
from app.modules.workflows.infrastructure.models import (
    WorkflowExecutionModel,
    WorkflowModel,
)
from app.modules.workflows.schemas import (
    WorkflowExecutionResponse,
    WorkflowResponse,
)

router = APIRouter(prefix="/workflows", tags=["workflows"])


@router.get("", response_model=list[WorkflowResponse])
async def list_workflows(
    ctx: TenantContext = Depends(require_permission("workflow.read")),
    session: AsyncSession = Depends(get_session),
):
    stmt = select(WorkflowModel).where(WorkflowModel.organization_id == ctx.organization_id)
    return (await session.execute(stmt)).scalars().all()


@router.post("/{workflow_id}/enable")
async def enable_workflow(
    workflow_id: UUID,
    ctx: TenantContext = Depends(require_permission("workflow.manage")),
    session: AsyncSession = Depends(get_session),
):
    wf = await session.get(WorkflowModel, workflow_id)
    if wf and wf.organization_id == ctx.organization_id:
        wf.is_enabled = True
        await session.commit()
    return {"enabled": True}


@router.post("/{workflow_id}/disable")
async def disable_workflow(
    workflow_id: UUID,
    ctx: TenantContext = Depends(require_permission("workflow.manage")),
    session: AsyncSession = Depends(get_session),
):
    wf = await session.get(WorkflowModel, workflow_id)
    if wf and wf.organization_id == ctx.organization_id:
        wf.is_enabled = False
        await session.commit()
    return {"enabled": False}


@router.get("/executions", response_model=list[WorkflowExecutionResponse])
async def list_executions(
    limit: int = Query(50, le=200),
    offset: int = Query(0, ge=0),
    ctx: TenantContext = Depends(require_permission("workflow.read")),
    session: AsyncSession = Depends(get_session),
):
    stmt = (
        select(WorkflowExecutionModel)
        .join(WorkflowModel, WorkflowModel.id == WorkflowExecutionModel.workflow_id)
        .where(WorkflowModel.organization_id == ctx.organization_id)
        .order_by(WorkflowExecutionModel.started_at.desc())
        .limit(limit).offset(offset)
    )
    return (await session.execute(stmt)).scalars().all()
