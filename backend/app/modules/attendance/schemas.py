from datetime import date
from uuid import UUID

from pydantic import BaseModel, Field


class AttendanceRecord(BaseModel):
    class_id: UUID
    student_id: UUID
    session_date: date
    status: str = Field(..., pattern="^(PRESENT|ABSENT|LATE|EXCUSED)$")
    note: str | None = None


class AttendanceBulkRecord(BaseModel):
    class_id: UUID
    session_date: date
    records: list[dict]  # [{"student_id": UUID, "status": "...", "note": "..."}]


class AttendanceCorrection(BaseModel):
    new_status: str
    reason: str | None = None


class AttendanceResponse(BaseModel):
    id: UUID
    class_id: UUID
    student_id: UUID
    session_date: date
    status: str
    note: str | None

    model_config = {"from_attributes": True}