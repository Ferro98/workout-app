from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from ..models import User, Program, ProgramDay, ProgramExercise

# --- 1. ESTRAZIONE CLIENTI ---
async def get_clients_for_coach(db: AsyncSession, coach_id: int):
    """Estrae tutti i clienti assegnati a uno specifico coach."""
    stmt = select(User).where(User.coach_id == coach_id, User.role == "client")
    result = await db.execute(stmt)
    return result.scalars().all()


# --- 2. ESTRAZIONE SCHEDA COMPLETA ---
async def get_active_program_for_client(db: AsyncSession, client_id: int, coach_id: int):
    """
    Estrae la scheda attiva di un cliente.
    Usa selectinload per pre-caricare Giorni -> Esercizi -> Target Sets + Dati Esercizio Base.
    """
    stmt = (
        select(Program)
        .join(User, Program.client_id == User.id)
        .where(
            Program.client_id == client_id, 
            Program.is_active == True,
            User.coach_id == coach_id)
        # Pre-carichiamo le relazioni a cascata
        .options(
            selectinload(Program.days)
            .selectinload(ProgramDay.exercises)
            .selectinload(ProgramExercise.exercise), # Fondamentale: serve a Pydantic per 'name' e 'type'
            
            selectinload(Program.days)
            .selectinload(ProgramDay.exercises)
            .selectinload(ProgramExercise.target_sets) # Carica le singole serie
        )
    )
    result = await db.execute(stmt)
    return result.scalar_one_or_none()