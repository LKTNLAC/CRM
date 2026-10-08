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
    
class ChannelPreference(BaseModel):
    channel: str
    channel_label: str
    enabled: bool
    locked: bool


class NotificationTypePreference(BaseModel):
    notification_type: str
    type_label: str
    channels: list[ChannelPreference]


class UpdatePreferenceRequest(BaseModel):
    notification_type: str
    channel: str
    enabled: bool