from fastapi import APIRouter
from sqlalchemy import text

from app.core.database import SessionLocal
from app.core.redis import get_redis

router = APIRouter(tags=["health"])


@router.get("/health")
async def health():
    return {"status": "ok"}


@router.get("/ready")
async def ready():
    checks = {"db": False, "redis": False}
    try:
        async with SessionLocal() as s:
            await s.execute(text("SELECT 1"))
        checks["db"] = True
    except Exception:
        pass
    try:
        await get_redis().ping()
        checks["redis"] = True
    except Exception:
        pass
    status = "ok" if all(checks.values()) else "degraded"
    return {"status": status, "checks": checks}