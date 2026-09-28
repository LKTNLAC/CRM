from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field


class TaskCreate(BaseModel):
    task_type: str = Field(..., max_length=64)
    title: str = Field(..., max_length=255)
    description: str | None = None
    assignee_id: UUID
    related_type: str | None = None
    related_id: UUID | None = None
    priority: str = "NORMAL"
    due_at: datetime | None = None


class TaskUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    status: str | None = None
    priority: str | None = None
    due_at: datetime | None = None
    cancelled_reason: str | None = None


class TaskResponse(BaseModel):
    id: UUID
    task_type: str
    title: str
    description: str | None
    assignee_id: UUID
    related_type: str | None
    related_id: UUID | None
    priority: str
    status: str
    due_at: datetime | None
    completed_at: datetime | None
    created_at: datetime

    model_config = {"from_attributes": True}