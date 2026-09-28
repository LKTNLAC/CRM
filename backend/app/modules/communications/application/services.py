from datetime import UTC, datetime
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.tenant import TenantContext
from app.modules.communications.infrastructure.models import CommunicationModel


class CommunicationService:
    def __init__(self, session: AsyncSession, tenant: TenantContext):
        self.session = session
        self.tenant = tenant

    async def create(
        self,
        channel: str,
        recipient: str,
        body: str,
        subject: str | None = None,
        related_type: str | None = None,
        related_id: UUID | None = None,
    ) -> CommunicationModel:
        c = CommunicationModel(
            organization_id=self.tenant.organization_id,
            channel=channel,
            recipient=recipient,
            subject=subject,
            body=body,
            status="PENDING",
            related_type=related_type,
            related_id=related_id,
        )
        self.session.add(c)
        await self.session.flush()
        await self.session.commit()
        return c

    async def list(self, channel: str | None = None, status: str | None = None, limit: int = 50, offset: int = 0):
        stmt = select(CommunicationModel).where(
            CommunicationModel.organization_id == self.tenant.organization_id
        )
        if channel:
            stmt = stmt.where(CommunicationModel.channel == channel)
        if status:
            stmt = stmt.where(CommunicationModel.status == status)
        stmt = stmt.order_by(CommunicationModel.created_at.desc()).limit(limit).offset(offset)
        return (await self.session.execute(stmt)).scalars().all()