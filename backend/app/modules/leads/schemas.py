from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, EmailStr, Field


class LeadCreate(BaseModel):
    full_name: str = Field(..., max_length=255)
    email: EmailStr | None = None
    phone: str | None = None
    source: str | None = None
    campaign: str | None = None
    interested_course_id: UUID | None = None
    counselor_id: UUID | None = None
    note: str | None = None


class LeadUpdate(BaseModel):
    full_name: str | None = None
    email: EmailStr | None = None
    phone: str | None = None
    source: str | None = None
    campaign: str | None = None
    interested_course_id: UUID | None = None
    counselor_id: UUID | None = None
    score: int | None = None
    note: str | None = None


class LeadStatusUpdate(BaseModel):
    status: str
    note: str | None = None
    lost_reason: str | None = None


class LeadConvertRequest(BaseModel):
    student_code: str | None = None
    date_of_birth: str | None = None
    gender: str | None = None
    address: str | None = None


class LeadResponse(BaseModel):
    id: UUID
    full_name: str
    email: str | None
    phone: str | None
    source: str | None
    status: str
    score: int
    counselor_id: UUID | None
    converted_student_id: UUID | None
    converted_at: datetime | None
    created_at: datetime

    model_config = {"from_attributes": True}


class LeadActivityResponse(BaseModel):
    id: UUID
    activity_type: str
    content: str | None
    old_status: str | None
    new_status: str | None
    created_at: datetime

    model_config = {"from_attributes": True}