from datetime import date, datetime, time
from uuid import UUID

from pydantic import BaseModel


class StudentPortalProfile(BaseModel):
    id: UUID
    student_code: str
    full_name: str
    email: str | None
    phone: str | None
    date_of_birth: date | None
    gender: str | None
    status: str

    model_config = {"from_attributes": True}


class ClassItem(BaseModel):
    class_id: str
    class_code: str
    class_name: str
    room: str | None
    status: str
    joined_at: str | None


class AttendanceItem(BaseModel):
    id: UUID
    class_id: UUID
    session_date: date
    status: str
    note: str | None

    model_config = {"from_attributes": True}


class ExamResultItem(BaseModel):
    exam_id: str
    exam_name: str
    exam_type: str
    max_score: float
    score: float
    grade: str | None
    feedback: str | None
    published_at: str | None


class ChildItem(BaseModel):
    student_id: str
    student_code: str
    full_name: str
    status: str
    is_primary: bool


class ScheduleItem(BaseModel):
    class_id: str
    class_name: str
    day_of_week: int
    start_time: str
    end_time: str
    room: str | None