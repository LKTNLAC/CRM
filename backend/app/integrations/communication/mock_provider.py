import uuid

from app.core.logging import get_logger
from app.integrations.base import CommunicationProvider, HealthStatus, SendResult

logger = get_logger(__name__)


class MockProvider(CommunicationProvider):
    """Provider giả để test nội bộ. Log ra structured log, không gửi thật."""

    def __init__(self, channel: str = "MOCK"):
        self.name = f"mock_{channel.lower()}"
        self.channel = channel

    async def send(
        self,
        recipient: str,
        body: str,
        subject: str | None = None,
        meta: dict | None = None,
    ) -> SendResult:
        message_id = f"mock-{uuid.uuid4()}"
        logger.info(
            "mock_send",
            channel=self.channel,
            recipient=recipient,
            subject=subject,
            body_preview=body[:80],
            message_id=message_id,
        )
        return SendResult(success=True, provider_message_id=message_id)

    async def health_check(self) -> HealthStatus:
        return HealthStatus(healthy=True, detail="mock provider always healthy")