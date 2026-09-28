import pytest


@pytest.mark.asyncio
async def test_health(client):
    r = await client.get("/api/v1/health")
    assert r.status_code == 200
    assert r.json()["status"] == "ok"


@pytest.mark.asyncio
async def test_login_invalid_email_format(client):
    r = await client.post("/api/v1/auth/login", json={"email": "not-an-email", "password": "x"})
    assert r.status_code == 422


@pytest.mark.asyncio
async def test_protected_without_token(client):
    r = await client.get("/api/v1/users/me")
    assert r.status_code == 401