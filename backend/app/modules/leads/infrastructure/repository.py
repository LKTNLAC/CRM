from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.tenant import TenantContext
from app.modules.leads.infrastructure.models import LeadActivityModel, LeadModel


class LeadRepository:
    def __init__(self, session: AsyncSession, tenant: TenantContext):
        self.session = session
        self.tenant = tenant

    def _base(self):
        return select(LeadModel).where(LeadModel.organization_id == self.tenant.organization_id)

    async def list(self, status: str | None = None, counselor_id: UUID | None = None, search: str | None = None, limit: int = 50, offset: int = 0):
        stmt = self._base()
        if status:
            stmt = stmt.where(LeadModel.status == status)
        if counselor_id:
            stmt = stmt.where(LeadModel.counselor_id == counselor_id)
        if search:
            stmt = stmt.where(LeadModel.full_name.ilike(f"%{search}%"))
        stmt = stmt.order_by(LeadModel.created_at.desc()).limit(limit).offset(offset)
        return (await self.session.execute(stmt)).scalars().all()

    async def get(self, lead_id: UUID) -> LeadModel | None:
        stmt = self._base().where(LeadModel.id == lead_id)
        return (await self.session.execute(stmt)).scalar_one_or_none()

    async def get_by_id_unscoped(self, lead_id: UUID) -> LeadModel | None:
        return await self.session.get(LeadModel, lead_id)

    async def create(self, **kwargs) -> LeadModel:
        lead = LeadModel(**kwargs)
        self.session.add(lead)
        await self.session.flush()
        return lead

    async def add_activity(self, **kwargs) -> LeadActivityModel:
        a = LeadActivityModel(**kwargs)
        self.session.add(a)
        await self.session.flush()
        return a