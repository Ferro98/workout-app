from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from ..models import User, Program, ProgramDay, ProgramExercise, TargetSet

async def get_programs_for_client(db: AsyncSession, client_id: int):
    """Estrae tutte le schede di uno specifico cliente."""
    stmt = select(Program).where(Program.client_id == client_id)
    result = await db.execute(stmt)
    return result.scalars().all()