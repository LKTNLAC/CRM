from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_session
from app.core.dependencies import get_tenant_context
from app.core.tenant import TenantContext
from app.modules.notifications.application.services import NotificationService
from app.modules.notifications.schemas import NotificationResponse

router = APIRouter(prefix="/notifications", tags=["notifications"])


@router.get("", response_model=list[NotificationResponse])
async def list_notifications(
    is_read: bool | None = Query(None),
    limit: int = Query(50, le=200),
    offset: int = Query(0, ge=0),
    ctx: TenantContext = Depends(get_tenant_context),
    session: AsyncSession = Depends(get_session),
):
    return await NotificationService(session, ctx).list(ctx.user_id, is_read=is_read, limit=limit, offset=offset)


@router.post("/{notification_id}/read")
async def mark_read(
    notification_id: UUID,
    ctx: TenantContext = Depends(get_tenant_context),
    session: AsyncSession = Depends(get_session),
):
    n = await NotificationService(session, ctx).mark_read(notification_id, ctx.user_id)
    return {"ok": n is not None}


@router.post("/read-all")
async def mark_all_read(
    ctx: TenantContext = Depends(get_tenant_context),
    session: AsyncSession = Depends(get_session),
):
    count = await NotificationService(session, ctx).mark_all_read(ctx.user_id)
    return {"marked": count}