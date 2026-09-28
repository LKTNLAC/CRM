from abc import ABC, abstractmethod
from dataclasses import dataclass


@dataclass
class SendResult:
    success: bool
    provider_message_id: str | None = None
    error: str | None = None


@dataclass
class HealthStatus:
    healthy: bool
    detail: str | None = None


class CommunicationProvider(ABC):
    name: str

    @abstractmethod
    async def send(
        self,
        recipient: str,
        body: str,
        subject: str | None = None,
        meta: dict | None = None,
    ) -> SendResult:
        ...

    @abstractmethod
    async def health_check(self) -> HealthStatus:
        ...


class PaymentProvider(ABC):
    name: str

    @abstractmethod
    async def create_intent(self, intent: dict) -> dict:
        ...

    @abstractmethod
    async def verify_webhook(self, payload: bytes, signature: str) -> bool:
        ...

    @abstractmethod
    async def refund(self, refund: dict) -> dict:
        ...


class StorageProvider(ABC):
    name: str

    @abstractmethod
    async def presign_upload(self, key: str, ttl: int) -> str:
        ...

    @abstractmethod
    async def presign_download(self, key: str, ttl: int) -> str:
        ...


class AIProvider(ABC):
    name: str

    @abstractmethod
    async def complete(self, prompt: str) -> str:
        ...