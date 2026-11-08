from dotenv import load_dotenv
import os

import pytest

load_dotenv()

TEST_DATABASE_URL = os.getenv("TEST_DATABASE_URL")
if not TEST_DATABASE_URL:
    pytest.exit("TEST_DATABASE_URL is not set", returncode=2)
elif TEST_DATABASE_URL == os.getenv("DATABASE_URL"):
    pytest.exit("TEST_DATABASE_URL should not be the same as DATABASE_URL", returncode=3)

os.environ["DATABASE_URL"] = TEST_DATABASE_URL

# Dummy JWT settings; setdefault keeps any value already set (e.g. from .env)
os.environ.setdefault("SECRET_KEY", "test-secret-not-used-anywhere")
os.environ.setdefault("ALGORITHM", "HS256")
os.environ.setdefault("ACCESS_TOKEN_EXPIRE_MINUTES", "60")

from alembic import command
from alembic.config import Config

from pathlib import Path

@pytest.fixture(scope="session", autouse=True)
def apply_migrations():
    config = Config(str(Path(__file__).resolve().parents[1] / "alembic.ini"))
    command.upgrade(config, "head")

from httpx import ASGITransport, AsyncClient
from sqlalchemy import text

from app.auth import create_token, hash_password
from app.db import AsyncSessionLocal, Base, engine
from app.main import app
from app.models import User

@pytest.fixture(autouse=True)
async def clean_db():
    tables = ", ".join(f'"{t.name}"' for t in Base.metadata.sorted_tables)
    async with engine.begin() as conn:
        await conn.execute(text(f"TRUNCATE {tables} RESTART IDENTITY CASCADE"))

@pytest.fixture
async def client():
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as c:
        yield c

@pytest.fixture
def make_user():
    async def _make_user(
        email: str = "client@test.com",
        password: str = "password123",
        full_name: str = "Test User",
        role: str = "client",
        coach_id: int | None = None,
    ) -> User:
        async with AsyncSessionLocal() as db:
            user = User(
                email=email,
                password_hash=hash_password(password),
                full_name=full_name,
                role=role,
                coach_id=coach_id,
                is_active=True,
            )
            db.add(user)
            await db.commit()
            await db.refresh(user)
            return user

    return _make_user

@pytest.fixture
def auth_headers():
    def _auth_headers(user: User) -> dict[str, str]:
        return {"Authorization": f"Bearer {create_token(user.id, user.role)}"}

    return _auth_headers