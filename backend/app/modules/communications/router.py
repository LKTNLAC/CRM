from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_session
from app.core.dependencies import require_permission
from app.core.tenant import TenantContext
from app.modules.communications.application.services import CommunicationService
from app.modules.communications.schemas import CommunicationCreate, CommunicationResponse

router = APIRouter(prefix="/communications", tags=["communications"])


@router.get("", response_model=list[CommunicationResponse])
async def list_communications(
    channel: str | None = Query(None),
    status: str | None = Query(None),
    limit: int = Query(50, le=200),
    offset: int = Query(0, ge=0),
    ctx: TenantContext = Depends(require_permission("communication.read")),
    session: AsyncSession = Depends(get_session),
):
    return await CommunicationService(session, ctx).list(channel=channel, status=status, limit=limit, offset=offset)


@router.post("", response_model=CommunicationResponse, status_code=201)
async def create_communication(
    body: CommunicationCreate,
    ctx: TenantContext = Depends(require_permission("communication.send")),
    session: AsyncSession = Depends(get_session),
):
    return await CommunicationService(session, ctx).create(**body.model_dump())