from app.integrations.base import CommunicationProvider
from app.integrations.communication.email_provider import EmailProvider
from app.integrations.communication.mock_provider import MockProvider
from app.integrations.communication.push_provider import PushProvider
from app.integrations.communication.sms_provider import SMSProvider
from app.integrations.communication.zalo_provider import ZaloProvider


class ProviderRegistry:
    def __init__(self):
        self._communication: dict[str, CommunicationProvider] = {}

    def register_communication(self, channel: str, provider: CommunicationProvider) -> None:
        self._communication[channel.upper()] = provider

    def get_communication(self, channel: str) -> CommunicationProvider:
        provider = self._communication.get(channel.upper())
        if not provider:
            # Fallback sang mock nếu chưa cấu hình
            return MockProvider(channel=channel)
        return provider

    def list_channels(self) -> list[str]:
        return list(self._communication.keys())


_registry: ProviderRegistry | None = None


def get_registry() -> ProviderRegistry:
    global _registry
    if _registry is None:
        _registry = ProviderRegistry()
        # Đăng ký mặc định
        _registry.register_communication("EMAIL", EmailProvider())
        _registry.register_communication("SMS", SMSProvider())
        _registry.register_communication("ZALO", ZaloProvider())
        _registry.register_communication("PUSH", PushProvider())
        _registry.register_communication("MOCK", MockProvider())
    return _registry