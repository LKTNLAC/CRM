from datetime import UTC, datetime, timedelta
from pathlib import Path
from uuid import UUID, uuid4

from argon2 import PasswordHasher
from argon2.exceptions import VerifyMismatchError
from jose import JWTError, jwt

from app.core.config import settings

_hasher = PasswordHasher()


def hash_password(password: str) -> str:
    return _hasher.hash(password)


def verify_password(password: str, hashed: str) -> bool:
    try:
        return _hasher.verify(hashed, password)
    except VerifyMismatchError:
        return False


def _load_key(path: str) -> str:
    return Path(path).read_text()


def create_access_token(
    user_id: UUID,
    organization_id: UUID,
    branch_id: UUID | None,
    roles: list[str],
) -> str:
    now = datetime.now(UTC)
    payload = {
        "sub": str(user_id),
        "org_id": str(organization_id),
        "branch_id": str(branch_id) if branch_id else None,
        "roles": roles,
        "jti": str(uuid4()),
        "iat": int(now.timestamp()),
        "exp": int((now + timedelta(seconds=settings.JWT_ACCESS_TTL)).timestamp()),
    }
    return jwt.encode(payload, _load_key(settings.JWT_PRIVATE_KEY_PATH), algorithm=settings.JWT_ALGORITHM)


def decode_access_token(token: str) -> dict:
    return jwt.decode(
        token,
        _load_key(settings.JWT_PUBLIC_KEY_PATH),
        algorithms=[settings.JWT_ALGORITHM],
    )