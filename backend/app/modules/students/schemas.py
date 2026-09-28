from datetime import date, datetime
from uuid import UUID

from pydantic import BaseModel, EmailStr, Field


class StudentCreate(BaseModel):
    full_name: str = Field(..., max_length=255)
    student_code: str | None = None
    email: EmailStr | None = None
    phone: str | None = None
    date_of_birth: date | None = None
    gender: str | None = None
    address: str | None = None
    counselor_id: UUID | None = None


class StudentUpdate(BaseModel):
    full_name: str | None = None
    email: EmailStr | None = None
    phone: str | None = None
    date_of_birth: date | None = None
    gender: str | None = None
    address: str | None = None
    counselor_id: UUID | None = None


class StudentResponse(BaseModel):
    id: UUID
    student_code: str
    full_name: str
    email: str | None
    phone: str | None
    date_of_birth: date | None
    gender: str | None
    status: str
    counselor_id: UUID | None
    user_id: UUID | None 
    created_at: datetime

    model_config = {"from_attributes": True}
    
class LinkUserRequest(BaseModel):
    user_id: UUID
    
    