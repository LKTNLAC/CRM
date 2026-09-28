from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field


class CommunicationCreate(BaseModel):
    channel: str = Field(..., pattern="^(EMAIL|SMS|ZALO|PUSH)$")
    recipient: str
    subject: str | None = None
    body: str
    related_type: str | None = None
    related_id: UUID | None = None


class CommunicationResponse(BaseModel):
    id: UUID
    channel: str
    recipient: str
    subject: str | None
    body: str
    status: str
    error: str | None
    sent_at: datetime | None
    created_at: datetime

    model_config = {"from_attributes": True}