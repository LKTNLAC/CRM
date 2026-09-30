from uuid import UUID

from pydantic import BaseModel, Field


class CourseCreate(BaseModel):
    code: str = Field(..., max_length=32)
    name: str = Field(..., max_length=255)
    description: str | None = None
    language: str | None = None


class CourseUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    language: str | None = None
    is_active: bool | None = None


class CourseResponse(BaseModel):
    id: UUID
    code: str
    name: str
    description: str | None
    language: str | None
    is_active: bool

    model_config = {"from_attributes": True}


class LevelCreate(BaseModel):
    code: str = Field(..., max_length=32)
    name: str = Field(..., max_length=255)
    sequence: int = 0
    duration_hours: int | None = None


class LevelResponse(BaseModel):
    id: UUID
    course_id: UUID
    code: str
    name: str
    sequence: int
    duration_hours: int | None

    model_config = {"from_attributes": True}
class LevelUpdate(BaseModel):
    code: str | None = None
    name: str | None = None
    sequence: int | None = None
    duration_hours: int | None = None    