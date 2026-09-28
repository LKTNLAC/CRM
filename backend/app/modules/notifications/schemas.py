from datetime import datetime
from uuid import UUID

from pydantic import BaseModel


class NotificationResponse(BaseModel):
    id: UUID
    notification_type: str
    title: str
    body: str | None
    related_type: str | None
    related_id: UUID | None
    is_read: bool
    read_at: datetime | None
    created_at: datetime

    model_config = {"from_attributes": True}