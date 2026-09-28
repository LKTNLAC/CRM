from datetime import UTC, datetime
from uuid import UUID, uuid4

from pydantic import BaseModel


class EventEnvelope(BaseModel):
    event_id: UUID
    event_type: str
    aggregate_type: str
    aggregate_id: UUID
    payload: dict
    timestamp: datetime
    source: str
    correlation_id: UUID | None = None
    version: int = 1

    @classmethod
    def create(
        cls,
        event_type: str,
        aggregate_type: str,
        aggregate_id: UUID,
        payload: dict,
        source: str,
        correlation_id: UUID | None = None,
    ) -> "EventEnvelope":
        return cls(
            event_id=uuid4(),
            event_type=event_type,
            aggregate_type=aggregate_type,
            aggregate_id=aggregate_id,
            payload=payload,
            timestamp=datetime.now(UTC),
            source=source,
            correlation_id=correlation_id,
        )