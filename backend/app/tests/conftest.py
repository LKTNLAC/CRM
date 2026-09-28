import os
from collections.abc import AsyncGenerator

import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

os.environ.setdefault("DATABASE_URL", "sqlite+aiosqlite:///:memory:")
os.environ.setdefault("REDIS_URL", "redis://localhost:6379/15")


@pytest_asyncio.fixture
async def db_session() -> AsyncGenerator[AsyncSession, None]:
    from app.core.database import Base
    # Import tất cả models để metadata đầy đủ
    import app.modules.auth.infrastructure.models  # noqa
    import app.modules.leads.infrastructure.models  # noqa
    import app.modules.students.infrastructure.models  # noqa
    import app.modules.guardians.infrastructure.models  # noqa
    import app.modules.tasks.infrastructure.models  # noqa
    import app.modules.courses.infrastructure.models  # noqa
    import app.modules.classes.infrastructure.models  # noqa
    import app.modules.enrollments.infrastructure.models  # noqa
    import app.modules.attendance.infrastructure.models  # noqa
    import app.modules.examinations.infrastructure.models  # noqa
    import app.modules.notifications.infrastructure.models  # noqa
    import app.modules.communications.infrastructure.models  # noqa
    import app.modules.workflows.infrastructure.models  # noqa
    import app.modules.audit.infrastructure.models  # noqa

    engine = create_async_engine(
        "sqlite+aiosqlite:///:memory:",
        connect_args={"check_same_thread": False},
    )
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    SessionLocal = async_sessionmaker(engine, expire_on_commit=False, class_=AsyncSession)
    async with SessionLocal() as session:
        yield session
    await engine.dispose()


@pytest_asyncio.fixture
async def client() -> AsyncGenerator[AsyncClient, None]:
    from app.main import app
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as c:
        yield c