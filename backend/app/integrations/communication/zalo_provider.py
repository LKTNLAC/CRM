from app.core.config import settings
from app.integrations.base import CommunicationProvider, HealthStatus, SendResult


class ZaloProvider(CommunicationProvider):
    """Zalo OA provider — chưa có credentials.

    Phase 7: skeleton.
    """

    name = "zalo"

    def __init__(self):
        self.app_id = getattr(settings, "ZALO_APP_ID", None)
        self.app_secret = getattr(settings, "ZALO_APP_SECRET", None)

    async def send(
        self,
        recipient: str,
        body: str,
        subject: str | None = None,
        meta: dict | None = None,
    ) -> SendResult:
        if not self.app_id:
            return SendResult(success=False, error="ZALO_APP_ID not configured")
        return SendResult(success=False, error="Zalo integration not implemented in Phase 7")

    async def health_check(self) -> HealthStatus:
        if not self.app_id:
            return HealthStatus(healthy=False, detail="ZALO_APP_ID not configured")
        return HealthStatus(healthy=True, detail="zalo configured")