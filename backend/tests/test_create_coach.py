import pytest
from sqlalchemy import func, select

from app.auth import verify_password
from app.create_coach import create_coach, main
from app.db import AsyncSessionLocal
from app.models import User


async def get_user(email: str) -> User | None:
    async with AsyncSessionLocal() as db:
        result = await db.execute(select(User).where(User.email == email))
        return result.scalar_one_or_none()


async def count_users() -> int:
    async with AsyncSessionLocal() as db:
        result = await db.execute(select(func.count()).select_from(User))
        return result.scalar_one()


def type_answers(monkeypatch, inputs: list[str], passwords: list[str]) -> None:
    """Replace the keyboard: input() and getpass() return the given answers in order."""
    typed = iter(inputs)
    secret = iter(passwords)
    monkeypatch.setattr("builtins.input", lambda _prompt="": next(typed))
    monkeypatch.setattr("app.create_coach.getpass", lambda _prompt="": next(secret))


# --- create_coach(): the part that touches the database ---


async def test_create_coach_saves_an_active_coach_with_a_hashed_password():
    async with AsyncSessionLocal() as db:
        coach = await create_coach(db, "coach@test.com", "Coach", "a-long-password")

    assert coach is not None
    saved = await get_user("coach@test.com")
    assert saved is not None
    assert saved.role == "coach"
    assert saved.is_active is True
    assert saved.password_hash != "a-long-password"
    assert verify_password("a-long-password", saved.password_hash)


async def test_create_coach_never_overwrites_an_existing_user(make_user):
    await make_user(email="coach@test.com", role="client", password="old-password")

    async with AsyncSessionLocal() as db:
        result = await create_coach(db, "coach@test.com", "Other", "new-long-password")

    assert result is None
    saved = await get_user("coach@test.com")
    assert saved.role == "client"
    assert verify_password("old-password", saved.password_hash)


# --- main(): the questions asked to the operator ---


async def test_main_creates_the_coach(monkeypatch):
    type_answers(monkeypatch, ["coach@test.com", "Coach"], ["a-long-password"] * 2)

    await main()

    saved = await get_user("coach@test.com")
    assert saved is not None and saved.role == "coach"


async def test_main_asks_again_when_the_password_is_too_short(monkeypatch):
    type_answers(
        monkeypatch,
        ["coach@test.com", "Coach"],
        ["short", "a-long-password", "a-long-password"],
    )

    await main()

    assert await count_users() == 1


async def test_main_exits_when_the_passwords_do_not_match(monkeypatch):
    type_answers(
        monkeypatch, ["coach@test.com", "Coach"], ["a-long-password", "another-password"]
    )

    with pytest.raises(SystemExit) as exit_info:
        await main()

    assert exit_info.value.code == 1
    assert await count_users() == 0


@pytest.mark.parametrize("answers", [["", "Coach"], ["coach@test.com", "   "]])
async def test_main_exits_when_email_or_name_is_empty(monkeypatch, answers):
    type_answers(monkeypatch, answers, [])

    with pytest.raises(SystemExit) as exit_info:
        await main()

    assert exit_info.value.code == 1
    assert await count_users() == 0


async def test_main_exits_when_the_email_is_already_taken(monkeypatch, make_user):
    await make_user(email="coach@test.com", role="client")
    type_answers(monkeypatch, ["coach@test.com", "Coach"], ["a-long-password"] * 2)

    with pytest.raises(SystemExit) as exit_info:
        await main()

    assert exit_info.value.code == 1
    assert (await get_user("coach@test.com")).role == "client"
