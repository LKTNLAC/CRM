from fastapi import APIRouter, Depends, Request
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_session
from app.modules.auth.application.services import AuthService
from app.modules.auth.schemas import LoginRequest, RefreshRequest, TokenResponse
from fastapi import APIRouter, Depends, Request
from app.core.rate_limit import check_rate_limit

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/login", response_model=TokenResponse)
async def login(
    body: LoginRequest,
    request: Request,
    session: AsyncSession = Depends(get_session),
):
    # Rate limit: 10 lần / 60 giây / IP
    client_ip = request.client.host if request.client else "unknown"
    await check_rate_limit(key=f"login:{client_ip}", limit=10, window=60)
    svc = AuthService(session)
    result = await svc.login(
        email=body.email,
        password=body.password,
        user_agent=request.headers.get("user-agent"),
        ip=request.client.host if request.client else None,
    )
    return result


@router.post("/refresh", response_model=TokenResponse)
async def refresh(
    body: RefreshRequest,
    session: AsyncSession = Depends(get_session),
):
    return await AuthService(session).refresh(body.refresh_token)


@router.post("/logout", status_code=204)
async def logout(
    body: RefreshRequest,
    session: AsyncSession = Depends(get_session),
):
    await AuthService(session).logout(body.refresh_token)