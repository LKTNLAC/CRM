"""Audit middleware — gắn request_id + correlation_id vào request.state.

Không ghi audit log ở middleware (vì business logic cần biết actor).
Middleware chỉ chuẩn bị context cho service ghi audit.
"""

import uuid
from collections.abc import Callable

from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware


class RequestContextMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        request_id = request.headers.get("X-Request-ID") or str(uuid.uuid4())
        correlation_id = request.headers.get("X-Correlation-ID") or request_id

        request.state.request_id = request_id
        request.state.correlation_id = correlation_id

        response = await call_next(request)
        response.headers["X-Request-ID"] = request_id
        response.headers["X-Correlation-ID"] = correlation_id
        return response