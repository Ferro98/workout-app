from sqlalchemy import func, select

from app.db import AsyncSessionLocal
from app.models import Exercise, User
from app.seed import seed_data
from app.seed_catalog import CATALOG_EXERCISES
from app.seed_catalog import main as seed_catalog


async def count(model) -> int:
    async with AsyncSessionLocal() as db:
        result = await db.execute(select(func.count()).select_from(model))
        return result.scalar_one()


async def test_seed_catalog_loads_exercises_and_no_users():
    await seed_catalog()

    assert await count(Exercise) == len(CATALOG_EXERCISES)
    # The production seed must never create accounts (the demo ones have a known password)
    assert await count(User) == 0


async def test_seed_catalog_is_idempotent():
    await seed_catalog()
    await seed_catalog()

    assert await count(Exercise) == len(CATALOG_EXERCISES)


async def test_demo_seed_still_works_on_top_of_the_catalog():
    # Regression: the demo seed imports the catalog code from seed_catalog
    await seed_data()

    assert await count(Exercise) == len(CATALOG_EXERCISES)
    assert await count(User) == 2
