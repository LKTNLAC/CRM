"""Rate limiting — Redis token bucket.

Dùng:
    @rate_limit(limit=5, window=60, key="login")
    async def login(...): ...
"""

import time
from functools import wraps

from fastapi import Request

from app.core.errors import RateLimitedError
from app.core.redis import get_redis


async def check_rate_limit(key: str, limit: int, window: int) -> None:
    """Raise RateLimitedError nếu vượt limit trong window (giây)."""
    redis = get_redis()
    now = int(time.time())
    bucket_key = f"rl:{key}:{now // window}"

    count = await redis.incr(bucket_key)
    if count == 1:
        await redis.expire(bucket_key, window)

    if count > limit:
        ttl = await redis.ttl(bucket_key)
        raise RateLimitedError(
            f"Rate limit exceeded. Try again in {ttl} seconds."
        )


def rate_limit(limit: int, window: int, key_prefix: str):
    """Decorator cho FastAPI endpoint."""

    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            request: Request | None = kwargs.get("request")
            if request is None:
                for arg in args:
                    if isinstance(arg, Request):
                        request = arg
                        break

            if request is None:
                return await func(*args, **kwargs)

            # Key theo IP + endpoint
            client_ip = request.client.host if request.client else "unknown"
            key = f"{key_prefix}:{client_ip}"

            await check_rate_limit(key=key, limit=limit, window=window)
            return await func(*args, **kwargs)

        return wrapper

    return decorator