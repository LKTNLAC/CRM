from datetime import datetime
from uuid import UUID

from pydantic import BaseModel


class WorkflowResponse(BaseModel):
    id: UUID
    code: str
    name: str
    trigger_event: str
    is_enabled: bool
    config: dict | None

    model_config = {"from_attributes": True}


class WorkflowExecutionResponse(BaseModel):
    id: UUID
    workflow_id: UUID
    event_type: str
    status: str
    attempt_count: int
    error: str | None
    actions_log: dict | None
    started_at: datetime
    finished_at: datetime | None

    model_config = {"from_attributes": True}
