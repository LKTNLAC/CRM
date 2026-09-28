from collections.abc import AsyncGenerator
from uuid import UUID

from fastapi import Depends, Header, Request
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_session
from app.core.errors import ForbiddenError, UnauthorizedError
from app.core.security import decode_access_token
from app.core.tenant import TenantContext

_bearer = HTTPBearer(auto_error=False)


async def get_tenant_context(
    request: Request,
    credentials: HTTPAuthorizationCredentials | None = Depends(_bearer),
) -> TenantContext:
    if credentials is None:
        raise UnauthorizedError()
    try:
        payload = decode_access_token(credentials.credentials)
    except Exception:
        raise UnauthorizedError("Invalid token") from None

    user_id = UUID(payload["sub"])
    org_id = UUID(payload["org_id"])
    branch_id = UUID(payload["branch_id"]) if payload.get("branch_id") else None
    roles = payload.get("roles", [])

    ctx = TenantContext(
        user_id=user_id,
        organization_id=org_id,
        branch_id=branch_id,
        roles=roles,
    )
    request.state.tenant = ctx
    return ctx


def require_permission(permission: str):
    async def _checker(
        ctx: TenantContext = Depends(get_tenant_context),
        session: AsyncSession = Depends(get_session),
    ) -> TenantContext:
        from app.modules.auth.infrastructure.repository import PermissionRepository

        repo = PermissionRepository(session)
        allowed = await repo.user_has_permission(ctx.user_id, permission)
        if not allowed:
            raise ForbiddenError(f"Missing permission: {permission}")
        return ctx

    return _checker


async def get_idempotency_key(
    idempotency_key: str | None = Header(default=None, alias="Idempotency-Key"),
) -> str | None:
    return idempotency_key


async def session_dep() -> AsyncGenerator[AsyncSession, None]:
    async for s in get_session():
        yield s