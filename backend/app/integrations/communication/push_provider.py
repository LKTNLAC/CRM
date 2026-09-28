from app.integrations.base import CommunicationProvider, HealthStatus, SendResult


class PushProvider(CommunicationProvider):
    """Push notification — chưa tích hợp FCM/APNs."""

    name = "push"

    async def send(
        self,
        recipient: str,
        body: str,
        subject: str | None = None,
        meta: dict | None = None,
    ) -> SendResult:
        return SendResult(success=False, error="Push provider not implemented in Phase 7")

    async def health_check(self) -> HealthStatus:
        return HealthStatus(healthy=False, detail="Push provider not implemented")