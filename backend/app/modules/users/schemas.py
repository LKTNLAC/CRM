from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, EmailStr, Field


class UserResponse(BaseModel):
    id: UUID
    email: str
    full_name: str
    organization_id: UUID
    branch_id: UUID | None
    roles: list[str]
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class UserCreate(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=12)
    full_name: str = Field(..., max_length=255)
    branch_id: UUID | None = None
    role_codes: list[str] = Field(..., min_items=1)


class UserUpdate(BaseModel):
    full_name: str | None = None
    branch_id: UUID | None = None
    is_active: bool | None = None


class ChangePassword(BaseModel):
    current_password: str
    new_password: str = Field(..., min_length=12)


class ResetPassword(BaseModel):
    new_password: str = Field(..., min_length=12)


class AssignRoles(BaseModel):
    role_codes: list[str]


class RoleResponse(BaseModel):
    id: UUID
    code: str
    name: str
    permissions: list[str]

    model_config = {"from_attributes": True}