from dataclasses import dataclass
from uuid import UUID


@dataclass(frozen=True)
class TenantContext:
    user_id: UUID
    organization_id: UUID
    branch_id: UUID | None
    roles: list[str]


@dataclass(frozen=True)
class DataScope:
    level: str  # ALL, ORG, BRANCH, ASG_STU, ASG_CLS, OWN, CHILD