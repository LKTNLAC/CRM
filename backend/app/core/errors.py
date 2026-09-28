from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException

from app.modules.auth.domain.exceptions import TokenReuseDetected


class AppError(Exception):
    code = "INTERNAL_ERROR"
    status_code = 500
    message = "Internal error"

    def __init__(self, message: str | None = None, details: list | None = None):
        self.message = message or self.message
        self.details = details or []


class ValidationError(AppError):
    code = "VALIDATION_ERROR"
    status_code = 422
    message = "Validation error"


class UnauthorizedError(AppError):
    code = "UNAUTHORIZED"
    status_code = 401
    message = "Unauthorized"


class ForbiddenError(AppError):
    code = "FORBIDDEN"
    status_code = 403
    message = "Forbidden"


class NotFoundError(AppError):
    code = "NOT_FOUND"
    status_code = 404
    message = "Not found"


class ConflictError(AppError):
    code = "CONFLICT"
    status_code = 409
    message = "Conflict"


class RateLimitedError(AppError):
    code = "RATE_LIMITED"
    status_code = 429
    message = "Rate limited"


def _envelope(code: str, message: str, details: list, request: Request) -> dict:
    return {
        "error": {
            "code": code,
            "message": message,
            "details": details,
            "request_id": getattr(request.state, "request_id", None),
        }
    }


def register_exception_handlers(app: FastAPI) -> None:
    @app.exception_handler(AppError)
    async def _app_error(request: Request, exc: AppError):
        return JSONResponse(
            status_code=exc.status_code,
            content=_envelope(exc.code, exc.message, exc.details, request),
        )

    @app.exception_handler(TokenReuseDetected)
    async def _token_reuse(request: Request, exc: TokenReuseDetected):
        return JSONResponse(
            status_code=401,
            content=_envelope(
                "TOKEN_REUSE_DETECTED",
                "Token reuse detected. All sessions have been revoked.",
                [],
                request,
            ),
        )

    @app.exception_handler(RequestValidationError)
    async def _validation(request: Request, exc: RequestValidationError):
        return JSONResponse(
            status_code=422,
            content=_envelope("VALIDATION_ERROR", "Validation error", exc.errors(), request),
        )

    @app.exception_handler(StarletteHTTPException)
    async def _http(request: Request, exc: StarletteHTTPException):
        return JSONResponse(
            status_code=exc.status_code,
            content=_envelope("HTTP_ERROR", str(exc.detail), [], request),
        )