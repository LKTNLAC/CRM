"""E2E critical flows.

Chạy khi có DB Postgres (không dùng SQLite).
Đánh dấu skip mặc định.
"""

import pytest

pytestmark = pytest.mark.skip(reason="E2E requires running PostgreSQL + Redis")


@pytest.mark.asyncio
async def test_lead_to_enrollment_flow(client):
    # 1. Login
    # 2. Create lead
    # 3. Change status CONTACTED
    # 4. Convert to student
    # 5. Create course + class
    # 6. Create enrollment
    # 7. Record attendance
    pass