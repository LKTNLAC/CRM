from dataclasses import dataclass
from datetime import datetime
from uuid import UUID


@dataclass
class RefreshToken:
    id: UUID
    user_id: UUID
    token_hash: str
    family_id: UUID
    issued_at: datetime
    expires_at: datetime
    revoked_at: datetime | None
    replaced_by: UUID | None