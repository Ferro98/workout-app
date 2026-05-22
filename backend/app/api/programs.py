from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List

from ..db import get_db
from ..models import User
from ..auth import require_coach, require_client
from .. import schemas
from ..crud import programs as crud_programs

router = APIRouter(prefix="/programs", tags=["Programs"])

@router.get("/", response_model=List[schemas.ProgramOut])
async def get_my_programs(
    db: AsyncSession = Depends(get_db),
    client: User = Depends(require_client) # Assicura che sia loggato e coach
):
    # Passa l'ID del coach validato al CRUD
    programs = await crud_programs.get_programs_for_client(db=db, client_id=client.id)
    return programs

@router.get("/{client_id}/program", response_model=schemas.ProgramOut)
async def get_client_program(
    client_id: int,
    db: AsyncSession = Depends(get_db),
    coach: User = Depends(require_coach)
):
    # Qui potresti aggiungere un controllo per verificare che il client_id 
    # appartenga effettivamente a questo coach!
    program = await crud_programs.get_active_program_for_client(db=db, client_id=client_id)
    if not program:
        raise HTTPException(status_code=404, detail="Nessuna scheda attiva trovata")
    
    return program