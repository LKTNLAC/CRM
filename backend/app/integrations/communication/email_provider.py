import asyncio
import smtplib
from email.message import EmailMessage

from app.core.config import settings
from app.core.logging import get_logger
from app.integrations.base import CommunicationProvider, HealthStatus, SendResult

logger = get_logger(__name__)


class EmailProvider(CommunicationProvider):
    """SMTP provider — chỉ hoạt động khi SMTP_HOST được cấu hình.

    Phase 7: skeleton. Nếu chưa có SMTP_HOST, health_check trả unhealthy.
    """

    name = "email"

    def __init__(self):
        self.host = getattr(settings, "SMTP_HOST", None)
        self.port = int(getattr(settings, "SMTP_PORT", 587) or 587)
        self.user = getattr(settings, "SMTP_USER", None)
        self.password = getattr(settings, "SMTP_PASSWORD", None)
        self.from_addr = getattr(settings, "SMTP_FROM", None) or self.user

    async def send(
        self,
        recipient: str,
        body: str,
        subject: str | None = None,
        meta: dict | None = None,
    ) -> SendResult:
        if not self.host:
            return SendResult(success=False, error="SMTP_HOST not configured")

        def _send() -> str:
            msg = EmailMessage()
            msg["From"] = self.from_addr
            msg["To"] = recipient
            msg["Subject"] = subject or "(no subject)"
            msg.set_content(body)

            with smtplib.SMTP(self.host, self.port, timeout=15) as server:
                server.starttls()
                if self.user and self.password:
                    server.login(self.user, self.password)
                server.send_message(msg)
            return msg["Message-ID"] or "sent"

        try:
            message_id = await asyncio.to_thread(_send)
            return SendResult(success=True, provider_message_id=message_id)
        except Exception as e:
            logger.error("email_send_failed", error=str(e), recipient=recipient)
            return SendResult(success=False, error=str(e))

    async def health_check(self) -> HealthStatus:
        if not self.host:
            return HealthStatus(healthy=False, detail="SMTP_HOST not configured")
        return HealthStatus(healthy=True, detail=f"smtp:{self.host}:{self.port}")