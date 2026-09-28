from datetime import UTC, datetime
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.auth.infrastructure.models import (
    Permission,
    RefreshTokenModel,
    Role,
    User,
)


class UserRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def get_by_email(self, email: str) -> User | None:
        stmt = select(User).where(User.email == email, User.deleted_at.is_(None))
        return (await self.session.execute(stmt)).scalar_one_or_none()

    async def get_by_id(self, user_id: UUID) -> User | None:
        return await self.session.get(User, user_id)


class PermissionRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def user_has_permission(self, user_id: UUID, code: str) -> bool:
        stmt = (
            select(Permission.id)
            .join(Role.permissions)
            .join(Role, Role.id == Permission.id)  # placeholder; thực tế qua association
        )
        # Simplified: dùng raw join qua association
        from app.modules.auth.infrastructure.models import role_permissions, user_roles
        stmt = (
            select(Permission.id)
            .join(role_permissions, role_permissions.c.permission_id == Permission.id)
            .join(user_roles, user_roles.c.role_id == role_permissions.c.role_id)
            .where(user_roles.c.user_id == user_id, Permission.code == code)
        )
        return (await self.session.execute(stmt)).first() is not None


class RefreshTokenRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def create(self, token: RefreshTokenModel) -> RefreshTokenModel:
        self.session.add(token)
        await self.session.flush()
        return token

    async def get_by_hash(self, token_hash: str) -> RefreshTokenModel | None:
        stmt = select(RefreshTokenModel).where(RefreshTokenModel.token_hash == token_hash)
        return (await self.session.execute(stmt)).scalar_one_or_none()

    async def revoke_family(self, family_id: UUID) -> None:
        stmt = select(RefreshTokenModel).where(
            RefreshTokenModel.family_id == family_id,
            RefreshTokenModel.revoked_at.is_(None),
        )
        tokens = (await self.session.execute(stmt)).scalars().all()
        now = datetime.now(UTC)
        for t in tokens:
            t.revoked_at = now