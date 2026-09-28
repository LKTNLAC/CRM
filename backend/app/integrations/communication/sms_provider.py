from app.core.config import settings
from app.integrations.base import CommunicationProvider, HealthStatus, SendResult


class SMSProvider(CommunicationProvider):
    """SMS provider — chưa tích hợp brandname cụ thể.

    Phase 7: trả về lỗi nếu chưa có SMS_API_KEY.
    """

    name = "sms"

    def __init__(self):
        self.api_key = getattr(settings, "SMS_PROVIDER_KEY", None)
        self.api_url = getattr(settings, "SMS_API_URL", None)

    async def send(
        self,
        recipient: str,
        body: str,
        subject: str | None = None,
        meta: dict | None = None,
    ) -> SendResult:
        if not self.api_key:
            return SendResult(success=False, error="SMS_PROVIDER_KEY not configured")
        # TODO: gọi HTTP API thật khi có credentials
        return SendResult(success=False, error="SMS provider not implemented in Phase 7")

    async def health_check(self) -> HealthStatus:
        if not self.api_key:
            return HealthStatus(healthy=False, detail="SMS_PROVIDER_KEY not configured")
        return HealthStatus(healthy=True, detail="sms configured")