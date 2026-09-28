from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.errors import ConflictError, ForbiddenError, NotFoundError
from app.core.password_policy import validate_password
from app.core.security import hash_password, verify_password
from app.core.tenant import TenantContext
from app.modules.auth.infrastructure.models import Role, User


class UserService:
    def __init__(self, session: AsyncSession, tenant: TenantContext):
        self.session = session
        self.tenant = tenant

    def _base(self):
        return select(User).where(
            User.organization_id == self.tenant.organization_id,
            User.deleted_at.is_(None),
        )

    async def list_users(self, role_code: str | None = None, search: str | None = None, limit: int = 50, offset: int = 0):
        stmt = self._base()
        if search:
            stmt = stmt.where(User.full_name.ilike(f"%{search}%") | User.email.ilike(f"%{search}%"))
        stmt = stmt.order_by(User.created_at.desc()).limit(limit).offset(offset)
        users = (await self.session.execute(stmt)).scalars().all()

        if role_code:
            users = [u for u in users if any(r.code == role_code for r in u.roles)]

        return users

    async def get(self, user_id: UUID) -> User:
        stmt = self._base().where(User.id == user_id)
        u = (await self.session.execute(stmt)).scalar_one_or_none()
        if not u:
            raise NotFoundError("User not found")
        return u

    async def create(self, data: dict) -> User:
        # Validate password
        validate_password(data["password"])

        # Check email unique
        existing = (await self.session.execute(
            select(User).where(User.email == data["email"])
        )).scalar_one_or_none()
        if existing:
            raise ConflictError(f"Email {data['email']} already exists")

        # Load roles
        role_codes = data.pop("role_codes")
        roles = (await self.session.execute(
            select(Role).where(Role.code.in_(role_codes))
        )).scalars().all()
        if len(roles) != len(role_codes):
            found = {r.code for r in roles}
            missing = set(role_codes) - found
            raise NotFoundError(f"Roles not found: {missing}")

        user = User(
            organization_id=self.tenant.organization_id,
            email=data["email"],
            password_hash=hash_password(data["password"]),
            full_name=data["full_name"],
            branch_id=data.get("branch_id"),
            is_active=True,
        )
        for r in roles:
            user.roles.append(r)
        self.session.add(user)
        await self.session.flush()
        await self.session.commit()
        return user

    async def update(self, user_id: UUID, data: dict) -> User:
        u = await self.get(user_id)
        for k, v in data.items():
            if v is not None:
                setattr(u, k, v)
        await self.session.commit()
        return u

    async def assign_roles(self, user_id: UUID, role_codes: list[str]) -> User:
        u = await self.get(user_id)

        # Không cho phép user tự bỏ role SUPER_ADMIN của chính mình
        if user_id == self.tenant.user_id and "SUPER_ADMIN" not in role_codes:
            raise ForbiddenError("Không thể bỏ quyền SUPER_ADMIN của chính mình")

        roles = (await self.session.execute(
            select(Role).where(Role.code.in_(role_codes))
        )).scalars().all()
        if len(roles) != len(role_codes):
            found = {r.code for r in roles}
            missing = set(role_codes) - found
            raise NotFoundError(f"Roles not found: {missing}")

        u.roles = list(roles)
        await self.session.commit()
        return u

    async def reset_password(self, user_id: UUID, new_password: str) -> None:
        validate_password(new_password)
        u = await self.get(user_id)
        u.password_hash = hash_password(new_password)
        u.failed_login_count = 0
        u.locked_until = None
        await self.session.commit()

    async def change_own_password(self, current: str, new: str) -> None:
        u = await self.get(self.tenant.user_id)
        if not verify_password(current, u.password_hash):
            raise ForbiddenError("Mật khẩu hiện tại không đúng")
        validate_password(new)
        u.password_hash = hash_password(new)
        await self.session.commit()

    async def deactivate(self, user_id: UUID) -> User:
        if user_id == self.tenant.user_id:
            raise ForbiddenError("Không thể tự vô hiệu hóa chính mình")
        u = await self.get(user_id)
        u.is_active = False
        await self.session.commit()
        return u