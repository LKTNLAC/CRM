import pytest


@pytest.mark.asyncio
async def test_permission_required_for_leads(client):
    r = await client.get("/api/v1/leads")
    assert r.status_code == 401


@pytest.mark.asyncio
async def test_workflows_protected(client):
    r = await client.get("/api/v1/workflows")
    assert r.status_code == 401


@pytest.mark.asyncio
async def test_reports_protected(client):
    r = await client.get("/api/v1/reports/dashboard")
    assert r.status_code == 401