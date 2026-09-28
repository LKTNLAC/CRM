import hashlib
import secrets
from datetime import UTC, datetime, timedelta
from uuid import UUID, uuid4

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.errors import UnauthorizedError
from app.core.security import create_access_token, hash_password, verify_password
from app.modules.auth.domain.exceptions import TokenReuseDetected
from app.modules.auth.infrastructure.models import RefreshTokenModel
from app.modules.auth.infrastructure.repository import (
    RefreshTokenRepository,
    UserRepository,
)


def _hash_refresh(token: str) -> str:
    return hashlib.sha256(token.encode()).hexdigest()


def _new_refresh_token() -> str:
    return secrets.token_urlsafe(48)


class AuthService:
    def __init__(self, session: AsyncSession):
        self.session = session
        self.users = UserRepository(session)
        self.tokens = RefreshTokenRepository(session)

    async def login(
        self,
        email: str,
        password: str,
        user_agent: str | None = None,
        ip: str | None = None,
    ) -> dict:
        user = await self.users.get_by_email(email)
        if not user or not user.is_active:
            raise UnauthorizedError("Invalid credentials")
        if user.locked_until and user.locked_until > datetime.now(UTC):
            raise UnauthorizedError("Account locked")

        if not verify_password(password, user.password_hash):
            user.failed_login_count += 1
            if user.failed_login_count >= 5:
                user.locked_until = datetime.now(UTC) + timedelta(minutes=15)
            await self.session.commit()
            raise UnauthorizedError("Invalid credentials")

        user.failed_login_count = 0
        user.locked_until = None

        access = create_access_token(
            user_id=user.id,
            organization_id=user.organization_id,
            branch_id=user.branch_id,
            roles=[r.code for r in user.roles],
        )
        refresh_raw = _new_refresh_token()
        family_id = uuid4()
        token = RefreshTokenModel(
            user_id=user.id,
            token_hash=_hash_refresh(refresh_raw),
            family_id=family_id,
            expires_at=datetime.now(UTC) + timedelta(seconds=settings.JWT_REFRESH_TTL),
            user_agent=user_agent,
            ip=ip,
        )
        await self.tokens.create(token)
        await self.session.commit()

        return {
            "access_token": access,
            "refresh_token": refresh_raw,
            "token_type": "bearer",
            "expires_in": settings.JWT_ACCESS_TTL,
        }

    async def refresh(self, refresh_raw: str) -> dict:
        token_hash = _hash_refresh(refresh_raw)
        record = await self.tokens.get_by_hash(token_hash)
        if not record:
            raise UnauthorizedError("Invalid refresh token")

        now = datetime.now(UTC)
        if record.revoked_at is not None:
            # reuse detection
            await self.tokens.revoke_family(record.family_id)
            await self.session.commit()
            raise TokenReuseDetected()

        if record.expires_at < now:
            raise UnauthorizedError("Refresh token expired")

        user = await self.users.get_by_id(record.user_id)
        if not user or not user.is_active:
            raise UnauthorizedError("User inactive")

        # rotate
        record.revoked_at = now
        new_raw = _new_refresh_token()
        new_record = RefreshTokenModel(
            user_id=user.id,
            token_hash=_hash_refresh(new_raw),
            family_id=record.family_id,
            expires_at=now + timedelta(seconds=settings.JWT_REFRESH_TTL),
        )
        await self.tokens.create(new_record)
        record.replaced_by = new_record.id
        await self.session.commit()

        access = create_access_token(
            user_id=user.id,
            organization_id=user.organization_id,
            branch_id=user.branch_id,
            roles=[r.code for r in user.roles],
        )
        return {
            "access_token": access,
            "refresh_token": new_raw,
            "token_type": "bearer",
            "expires_in": settings.JWT_ACCESS_TTL,
        }

    async def logout(self, refresh_raw: str) -> None:
        record = await self.tokens.get_by_hash(_hash_refresh(refresh_raw))
        if record:
            await self.tokens.revoke_family(record.family_id)
            await self.session.commit()