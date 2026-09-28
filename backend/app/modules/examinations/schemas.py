from datetime import datetime
from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel, Field


class ExamCreate(BaseModel):
    class_id: UUID
    name: str = Field(..., max_length=255)
    exam_type: str
    max_score: Decimal = Decimal("100")
    scheduled_at: datetime | None = None


class ExamUpdate(BaseModel):
    name: str | None = None
    scheduled_at: datetime | None = None
    status: str | None = None


class ExamResponse(BaseModel):
    id: UUID
    class_id: UUID
    name: str
    exam_type: str
    max_score: Decimal
    scheduled_at: datetime | None
    status: str

    model_config = {"from_attributes": True}


class ResultCreate(BaseModel):
    student_id: UUID
    score: Decimal
    grade: str | None = None
    feedback: str | None = None


class ResultResponse(BaseModel):
    id: UUID
    exam_id: UUID
    student_id: UUID
    score: Decimal
    grade: str | None
    feedback: str | None
    published_at: datetime | None

    model_config = {"from_attributes": True}
