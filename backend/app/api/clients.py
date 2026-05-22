from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List

from ..db import get_db
from ..models import User
from ..auth import require_coach
from .. import schemas
from ..crud import users as crud_users

router = APIRouter(prefix="/clients", tags=["Clients"])

@router.get("/", response_model=List[schemas.ClientOut])
async def get_my_clients(
    db: AsyncSession = Depends(get_db),
    coach: User = Depends(require_coach) # Assicura che sia loggato e coach
):
    # Passa l'ID del coach validato al CRUD
    clients = await crud_users.get_clients_for_coach(db=db, coach_id=coach.id)
    return clients

@router.get("/{client_id}/program", response_model=schemas.ProgramOut)
async def get_client_program(
    client_id: int,
    db: AsyncSession = Depends(get_db),
    coach: User = Depends(require_coach)
):
    program = await crud_users.get_active_program_for_client(
        db=db, 
        client_id=client_id,
        coach_id=coach.id)
    if not program:
        raise HTTPException(status_code=404, detail="Nessuna scheda attiva trovata")
    
    return program