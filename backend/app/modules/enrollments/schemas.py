from datetime import date
from uuid import UUID

from pydantic import BaseModel, Field


class EnrollmentCreate(BaseModel):
    student_id: UUID
    course_id: UUID
    level_id: UUID | None = None
    class_id: UUID
    start_date: date
    note: str | None = None


class EnrollmentTransfer(BaseModel):
    new_class_id: UUID
    transfer_date: date
    reason: str | None = None


class EnrollmentResponse(BaseModel):
    id: UUID
    student_id: UUID
    course_id: UUID
    level_id: UUID | None
    status: str
    start_date: date
    end_date: date | None

    model_config = {"from_attributes": True}


class EnrollmentClassResponse(BaseModel):
    id: UUID
    enrollment_id: UUID
    class_id: UUID
    joined_at: date
    left_at: date | None
    left_reason: str | None
    status: str

    model_config = {"from_attributes": True}