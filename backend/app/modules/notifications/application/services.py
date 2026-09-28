from datetime import UTC, datetime
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.tenant import TenantContext
from app.modules.notifications.infrastructure.models import NotificationModel


class NotificationService:
    def __init__(self, session: AsyncSession, tenant: TenantContext):
        self.session = session
        self.tenant = tenant

    async def send(
        self,
        user_id: UUID,
        notification_type: str,
        title: str,
        body: str | None = None,
        related_type: str | None = None,
        related_id: UUID | None = None,
    ) -> NotificationModel:
        n = NotificationModel(
            organization_id=self.tenant.organization_id,
            user_id=user_id,
            notification_type=notification_type,
            title=title,
            body=body,
            related_type=related_type,
            related_id=related_id,
        )
        self.session.add(n)
        await self.session.flush()
        return n

    async def list(self, user_id: UUID, is_read: bool | None = None, limit: int = 50, offset: int = 0):
        stmt = select(NotificationModel).where(
            NotificationModel.organization_id == self.tenant.organization_id,
            NotificationModel.user_id == user_id,
        )
        if is_read is not None:
            stmt = stmt.where(NotificationModel.is_read == is_read)
        stmt = stmt.order_by(NotificationModel.created_at.desc()).limit(limit).offset(offset)
        return (await self.session.execute(stmt)).scalars().all()

    async def mark_read(self, notification_id: UUID, user_id: UUID):
        stmt = select(NotificationModel).where(
            NotificationModel.id == notification_id,
            NotificationModel.user_id == user_id,
        )
        n = (await self.session.execute(stmt)).scalar_one_or_none()
        if n:
            n.is_read = True
            n.read_at = datetime.now(UTC)
            await self.session.commit()
        return n

    async def mark_all_read(self, user_id: UUID):
        stmt = select(NotificationModel).where(
            NotificationModel.user_id == user_id,
            NotificationModel.is_read == False,  # noqa: E712
        )
        notifications = (await self.session.execute(stmt)).scalars().all()
        now = datetime.now(UTC)
        for n in notifications:
            n.is_read = True
            n.read_at = now
        await self.session.commit()
        return len(notifications)