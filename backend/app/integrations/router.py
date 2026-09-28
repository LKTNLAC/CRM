from fastapi import APIRouter, Depends

from app.core.dependencies import require_permission
from app.core.tenant import TenantContext
from app.integrations.registry import get_registry

router = APIRouter(prefix="/integrations", tags=["integrations"])


@router.get("/health")
async def integrations_health(
    ctx: TenantContext = Depends(require_permission("integration.read")),
):
    registry = get_registry()
    results = {}
    for channel in registry.list_channels():
        provider = registry.get_communication(channel)
        try:
            status = await provider.health_check()
            results[channel] = {"healthy": status.healthy, "detail": status.detail}
        except Exception as e:
            results[channel] = {"healthy": False, "detail": str(e)}
    return {"channels": results}