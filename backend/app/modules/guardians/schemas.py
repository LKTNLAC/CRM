from uuid import UUID

from pydantic import BaseModel, EmailStr, Field


class GuardianCreate(BaseModel):
    full_name: str = Field(..., max_length=255)
    email: EmailStr | None = None
    phone: str
    relationship: str | None = None
    address: str | None = None
    note: str | None = None


class GuardianUpdate(BaseModel):
    full_name: str | None = None
    email: EmailStr | None = None
    phone: str | None = None
    relationship: str | None = None
    address: str | None = None
    note: str | None = None


class GuardianResponse(BaseModel):
    id: UUID
    full_name: str
    email: str | None
    phone: str
    relationship: str | None
    address: str | None
    user_id: UUID | None

    model_config = {"from_attributes": True}


class LinkGuardianRequest(BaseModel):
    guardian_id: UUID
    is_primary: bool = False


class LinkUserRequest(BaseModel):
    user_id: UUID