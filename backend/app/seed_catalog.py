import asyncio

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db import AsyncSessionLocal
from app.models import Exercise

CATALOG_EXERCISES: list[dict[str, str]] = [
    {"name": "Panca Piana Bilanciere", "category": "chest", "type": "weight"},
    {"name": "Panca Inclinata Manubri", "category": "chest", "type": "weight"},
    {"name": "Croci Cavi Alti", "category": "chest", "type": "weight"},
    {"name": "Dip alle Parallele", "category": "chest", "type": "bodyweight"},
    {"name": "Pec Deck", "category": "chest", "type": "weight"},
    {"name": "Trazioni Lat Machine", "category": "back", "type": "weight"},
    {"name": "Trazioni alla Sbarra", "category": "back", "type": "bodyweight"},
    {"name": "Rematore Bilanciere", "category": "back", "type": "weight"},
    {"name": "Rematore Manubrio", "category": "back", "type": "weight"},
    {"name": "Pulley Basso", "category": "back", "type": "weight"},
    {"name": "Stacco da Terra", "category": "back", "type": "weight"},
    {"name": "Squat Bilanciere", "category": "legs", "type": "weight"},
    {"name": "Leg Press", "category": "legs", "type": "weight"},
    {"name": "Affondi Manubri", "category": "legs", "type": "weight"},
    {"name": "Leg Extension", "category": "legs", "type": "weight"},
    {"name": "Leg Curl", "category": "legs", "type": "weight"},
    {"name": "Calf Raises", "category": "legs", "type": "weight"},
    {"name": "Lento Avanti Bilanciere", "category": "shoulders", "type": "weight"},
    {"name": "Arnold Press", "category": "shoulders", "type": "weight"},
    {"name": "Alzate Laterali", "category": "shoulders", "type": "weight"},
    {"name": "Face Pull", "category": "shoulders", "type": "weight"},
    {"name": "Curl Bilanciere", "category": "arms", "type": "weight"},
    {"name": "Curl Manubri Alternato", "category": "arms", "type": "weight"},
    {"name": "Push-down Cavo", "category": "arms", "type": "weight"},
    {"name": "French Press", "category": "arms", "type": "weight"},
    {"name": "Plank Addominale", "category": "core", "type": "timed"},
    {"name": "Crunch", "category": "core", "type": "bodyweight"},
    {"name": "Russian Twist", "category": "core", "type": "bodyweight"},
    {"name": "Leg Raise", "category": "core", "type": "bodyweight"},
    {"name": "Ab Wheel", "category": "core", "type": "bodyweight"},
]

async def seed_exercises(db: AsyncSession) -> dict[str, Exercise]:
    """Insert missing catalog exercises and return a name -> Exercise map"""
    print("📚 Checking exercise catalog...")
    names = [ex["name"] for ex in CATALOG_EXERCISES]
    res = await db.execute(select(Exercise).where(Exercise.name.in_(names)))
    existing = res.scalars().all()
    exercise_map = {e.name: e for e in existing}

    new_exercises: list[Exercise] = []
    for ex in CATALOG_EXERCISES:
        if ex["name"] not in exercise_map:
            ex_obj = Exercise(
                name=ex["name"],
                category=ex["category"],
                type=ex["type"],
                created_by=None
            )
            new_exercises.append(ex_obj)
            exercise_map[ex["name"]] = ex_obj
            print(f"➕ Created: {ex['name']}")
    if new_exercises:
        db.add_all(new_exercises)
        await db.flush()
    created, total = len(new_exercises), len(CATALOG_EXERCISES)
    print(f"📚 Exercise catalog: {created} created, {total - created} already present (total {total})")
    return exercise_map


async def main():
    async with AsyncSessionLocal() as db:
        await seed_exercises(db)
        await db.commit()

if __name__ == "__main__":
    asyncio.run(main())