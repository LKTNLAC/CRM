from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Ensure all models are loaded so SQLAlchemy resolves FKs
import app.modules.auth.infrastructure.models  # noqa: F401
import app.modules.students.infrastructure.models  # noqa: F401
import app.modules.tasks.infrastructure.models  # noqa: F401
import app.modules.notifications.infrastructure.models  # noqa: F401
import app.modules.communications.infrastructure.models  # noqa: F401
import app.modules.leads.infrastructure.models  # noqa: F401
import app.modules.guardians.infrastructure.models  # noqa: F401
import app.modules.courses.infrastructure.models  # noqa: F401
import app.modules.classes.infrastructure.models  # noqa: F401
import app.modules.enrollments.infrastructure.models  # noqa: F401
import app.modules.attendance.infrastructure.models  # noqa: F401
import app.modules.examinations.infrastructure.models  # noqa: F401
import app.modules.workflows.infrastructure.models  # noqa: F401
import app.modules.audit.infrastructure.models  # noqa: F401

from app.api.v1.router import api_router
from app.core.config import settings
from app.core.errors import register_exception_handlers
from app.core.logging import setup_logging
from app.core.redis import close_redis, init_redis
from app.middleware.audit import RequestContextMiddleware


@asynccontextmanager
async def lifespan(app: FastAPI):
    setup_logging()
    await init_redis()
    yield
    await close_redis()


app = FastAPI(
    title=settings.APP_NAME,
    version="0.1.0",
    docs_url="/docs" if settings.APP_DEBUG else None,
    redoc_url=None,
    lifespan=lifespan,
)

app.add_middleware(RequestContextMiddleware)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

register_exception_handlers(app)
app.include_router(api_router, prefix="/api/v1")