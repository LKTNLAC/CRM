def is_token_valid(expires_at, revoked_at, now) -> bool:
    if revoked_at is not None:
        return False
    return expires_at > now