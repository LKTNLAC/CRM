from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_session
from app.core.dependencies import require_permission
from app.core.tenant import TenantContext
from app.modules.leads.application.services import LeadService
from app.modules.leads.schemas import (
    LeadConvertRequest,
    LeadCreate,
    LeadResponse,
    LeadStatusUpdate,
    LeadUpdate,
)

router = APIRouter(prefix="/leads", tags=["leads"])


@router.get("", response_model=list[LeadResponse])
async def list_leads(
    status: str | None = Query(None),
    counselor_id: UUID | None = Query(None),
    search: str | None = Query(None),
    limit: int = Query(50, le=200),
    offset: int = Query(0, ge=0),
    ctx: TenantContext = Depends(require_permission("lead.read")),
    session: AsyncSession = Depends(get_session),
):
    svc = LeadService(session, ctx)
    return await svc.list(status=status, counselor_id=counselor_id, search=search, limit=limit, offset=offset)


@router.post("", response_model=LeadResponse, status_code=201)
async def create_lead(
    body: LeadCreate,
    ctx: TenantContext = Depends(require_permission("lead.create")),
    session: AsyncSession = Depends(get_session),
):
    svc = LeadService(session, ctx)
    return await svc.create(body.model_dump())


@router.get("/{lead_id}", response_model=LeadResponse)
async def get_lead(
    lead_id: UUID,
    ctx: TenantContext = Depends(require_permission("lead.read")),
    session: AsyncSession = Depends(get_session),
):
    svc = LeadService(session, ctx)
    return await svc.get(lead_id)


@router.patch("/{lead_id}", response_model=LeadResponse)
async def update_lead(
    lead_id: UUID,
    body: LeadUpdate,
    ctx: TenantContext = Depends(require_permission("lead.update")),
    session: AsyncSession = Depends(get_session),
):
    svc = LeadService(session, ctx)
    return await svc.update(lead_id, body.model_dump(exclude_none=True))


@router.post("/{lead_id}/status", response_model=LeadResponse)
async def change_status(
    lead_id: UUID,
    body: LeadStatusUpdate,
    ctx: TenantContext = Depends(require_permission("lead.update")),
    session: AsyncSession = Depends(get_session),
):
    svc = LeadService(session, ctx)
    return await svc.change_status(lead_id, body.status, body.note, body.lost_reason)


@router.post("/{lead_id}/convert")
async def convert_lead(
    lead_id: UUID,
    body: LeadConvertRequest,
    ctx: TenantContext = Depends(require_permission("lead.convert")),
    session: AsyncSession = Depends(get_session),
):
    svc = LeadService(session, ctx)
    return await svc.convert(lead_id, body.model_dump(exclude_none=True))