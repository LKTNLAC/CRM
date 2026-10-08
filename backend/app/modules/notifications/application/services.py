from datetime import UTC, datetime
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.tenant import TenantContext
from app.modules.notifications.infrastructure.models import NotificationModel
from app.core.errors import ConflictError, NotFoundError

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
        # Check preference
        enabled = await self.is_channel_enabled(user_id, notification_type, "IN_APP")
        if not enabled:
            return None  # skip
        
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
    
    async def is_channel_enabled(
        self, user_id: UUID, notification_type: str, channel: str
    ) -> bool:
        """Check preference. Default = True nếu chưa có record."""
        from app.modules.notifications.domain.types import ALWAYS_ON_TYPES

        # Loại quan trọng luôn bật
        if notification_type in ALWAYS_ON_TYPES:
            return True

        from app.modules.notifications.infrastructure.models import (
            NotificationPreferenceModel,
        )

        stmt = select(NotificationPreferenceModel).where(
            NotificationPreferenceModel.user_id == user_id,
            NotificationPreferenceModel.notification_type == notification_type,
            NotificationPreferenceModel.channel == channel,
        )
        pref = (await self.session.execute(stmt)).scalar_one_or_none()

        if pref is None:
            return True  # default: enabled
        return pref.enabled

    async def get_preferences(self, user_id: UUID) -> list[dict]:
        """Trả về ma trận preferences (type × channel)."""
        from app.modules.notifications.domain.types import (
            ALL_CHANNELS,
            ALL_TYPES,
            ALWAYS_ON_TYPES,
            CHANNEL_LABELS,
            TYPE_LABELS,
        )
        from app.modules.notifications.infrastructure.models import (
            NotificationPreferenceModel,
        )

        # Load all records của user
        stmt = select(NotificationPreferenceModel).where(
            NotificationPreferenceModel.user_id == user_id
        )
        prefs = (await self.session.execute(stmt)).scalars().all()

        # Build dict: {(type, channel) → enabled}
        pref_map = {(p.notification_type, p.channel): p.enabled for p in prefs}

        result = []
        for ntype in ALL_TYPES:
            channels = []
            for ch in ALL_CHANNELS:
                always_on = ntype in ALWAYS_ON_TYPES
                enabled = (
                    True
                    if always_on
                    else pref_map.get((ntype, ch), True)
                )
                channels.append(
                    {
                        "channel": ch,
                        "channel_label": CHANNEL_LABELS.get(ch, ch),
                        "enabled": enabled,
                        "locked": always_on,
                    }
                )
            result.append(
                {
                    "notification_type": ntype,
                    "type_label": TYPE_LABELS.get(ntype, ntype),
                    "channels": channels,
                }
            )
        return result

    async def update_preference(
        self, user_id: UUID, notification_type: str, channel: str, enabled: bool
    ) -> None:
        """Upsert preference."""
        from app.modules.notifications.domain.types import (
            ALL_CHANNELS,
            ALL_TYPES,
            ALWAYS_ON_TYPES,
        )
        from app.modules.notifications.infrastructure.models import (
            NotificationPreferenceModel,
        )

        if notification_type not in ALL_TYPES:
            raise NotFoundError(f"Unknown notification type: {notification_type}")
        if channel not in ALL_CHANNELS:
            raise NotFoundError(f"Unknown channel: {channel}")
        if notification_type in ALWAYS_ON_TYPES:
            raise ConflictError("This notification type cannot be disabled")

        stmt = select(NotificationPreferenceModel).where(
            NotificationPreferenceModel.user_id == user_id,
            NotificationPreferenceModel.notification_type == notification_type,
            NotificationPreferenceModel.channel == channel,
        )
        pref = (await self.session.execute(stmt)).scalar_one_or_none()

        if pref:
            pref.enabled = enabled
        else:
            pref = NotificationPreferenceModel(
                user_id=user_id,
                notification_type=notification_type,
                channel=channel,
                enabled=enabled,
            )
            self.session.add(pref)

        await self.session.commit()