from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.audit.infrastructure.models import AuditLog


class AuditService:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def log(
        self,
        action: str,
        resource: str,
        resource_id: UUID | None = None,
        organization_id: UUID | None = None,
        actor_type: str = "USER",
        actor_id: UUID | None = None,
        old_value: dict | None = None,
        new_value: dict | None = None,
        ip_address: str | None = None,
        user_agent: str | None = None,
        request_id: UUID | None = None,
        correlation_id: UUID | None = None,
    ) -> None:
        self.session.add(AuditLog(
            organization_id=organization_id,
            actor_type=actor_type,
            actor_id=actor_id,
            action=action,
            resource=resource,
            resource_id=resource_id,
            old_value=old_value,
            new_value=new_value,
            ip_address=ip_address,
            user_agent=user_agent,
            request_id=request_id,
            correlation_id=correlation_id,
        ))