from dataclasses import dataclass
from datetime import datetime
from uuid import UUID


@dataclass
class Task:
    id: UUID
    organization_id: UUID
    branch_id: UUID | None
    task_type: str
    title: str
    description: str | None
    assignee_id: UUID
    created_by: UUID | None
    related_type: str | None
    related_id: UUID | None
    priority: str
    status: str
    due_at: datetime | None
    completed_at: datetime | None
    cancelled_reason: str | None
    created_at: datetime
    updated_at: datetime