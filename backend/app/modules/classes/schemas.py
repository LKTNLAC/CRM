from datetime import date, time
from uuid import UUID

from pydantic import BaseModel, Field


class ClassCreate(BaseModel):
    course_id: UUID
    level_id: UUID | None = None
    code: str = Field(..., max_length=64)
    name: str = Field(..., max_length=255)
    room: str | None = None
    capacity: int = 20
    start_date: date | None = None
    end_date: date | None = None


class ClassUpdate(BaseModel):
    name: str | None = None
    room: str | None = None
    capacity: int | None = None
    status: str | None = None
    start_date: date | None = None
    end_date: date | None = None


class ScheduleCreate(BaseModel):
    day_of_week: int = Field(..., ge=0, le=6)
    start_time: time
    end_time: time
    room: str | None = None


class ScheduleResponse(BaseModel):
    id: UUID
    day_of_week: int
    start_time: time
    end_time: time
    room: str | None
    status: str

    model_config = {"from_attributes": True}


class TeacherAssign(BaseModel):
    teacher_id: UUID
    role: str = "MAIN"
    from_date: date


class ClassResponse(BaseModel):
    id: UUID
    course_id: UUID
    level_id: UUID | None
    code: str
    name: str
    room: str | None
    capacity: int
    status: str
    start_date: date | None
    end_date: date | None

    model_config = {"from_attributes": True}