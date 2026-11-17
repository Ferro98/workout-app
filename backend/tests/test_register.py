import pytest
from sqlalchemy import func, select

from app.db import AsyncSessionLocal
from app.models import User


def payload(role: str = "client") -> dict:
    return {
        "email": "new@test.com",
        "password": "a-long-password",
        "fullName": "New User",
        "role": role,
    }


async def count_users() -> int:
    async with AsyncSessionLocal() as db:
        result = await db.execute(select(func.count()).select_from(User))
        return result.scalar_one()


@pytest.mark.parametrize("role", ["client", "coach"])
async def test_register_is_disabled_by_default(client, role):
    response = await client.post("/auth/register", json=payload(role))

    assert response.status_code == 403
    assert await count_users() == 0


async def test_register_never_creates_a_coach(client, monkeypatch):
    monkeypatch.setenv("ALLOW_PUBLIC_REGISTRATION", "true")

    response = await client.post("/auth/register", json=payload("coach"))

    assert response.status_code == 403
    assert await count_users() == 0


async def test_register_client_works_when_enabled(client, monkeypatch):
    monkeypatch.setenv("ALLOW_PUBLIC_REGISTRATION", "true")

    response = await client.post("/auth/register", json=payload("client"))

    assert response.status_code == 200
    assert response.json()["role"] == "client"
    assert await count_users() == 1
