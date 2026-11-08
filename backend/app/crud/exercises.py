from collections.abc import Sequence

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ..models import Exercise


async def get_exercises(db: AsyncSession) -> Sequence[Exercise]:
    """Returns the exercises catalog as a list"""
    stmt = (
        select(Exercise)
        .order_by(Exercise.category, Exercise.name)
    )
    result = await db.execute(stmt)
    return result.scalars().all()
