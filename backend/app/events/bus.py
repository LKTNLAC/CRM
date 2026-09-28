from abc import ABC, abstractmethod

from app.events.envelope import EventEnvelope


class EventBus(ABC):
    @abstractmethod
    async def publish(self, event: EventEnvelope) -> None:
        ...

    @abstractmethod
    async def subscribe(self, event_type: str, handler) -> None:
        ...
