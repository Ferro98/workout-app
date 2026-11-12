import pytest
from sqlalchemy.exc import OperationalError

from app.db import get_db
from app.main import app


@pytest.fixture
def broken_db():
    """Make every DB session fail, as if the database were unreachable."""

    class BrokenSession:
        async def execute(self, *args, **kwargs):
            # The message mimics a real driver error: it must never reach the response
            raise OperationalError("SELECT 1", {}, Exception("password=secret host=db.internal"))

    async def _broken_get_db():
        yield BrokenSession()

    app.dependency_overrides[get_db] = _broken_get_db
    yield
    app.dependency_overrides.pop(get_db, None)


async def test_health(client):
    response = await client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


async def test_health_ready(client):
    response = await client.get("/health/ready")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


async def test_health_ready_db_down(client, broken_db):
    response = await client.get("/health/ready")
    assert response.status_code == 503
    assert response.json() == {"detail": "DB unavailable."}
    # Internal details of the failure must not leak to the caller
    assert "secret" not in response.text


async def test_health_stays_ok_when_db_down(client, broken_db):
    # Liveness must not depend on the database
    response = await client.get("/health")
    assert response.status_code == 200
