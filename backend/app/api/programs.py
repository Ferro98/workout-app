from backend.app.crud import diff_service
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List

from ..db import get_db
from ..models import User
from ..auth import get_current_user, require_coach, require_client
from .. import schemas
from ..crud import programs as crud_programs

router = APIRouter(prefix="/programs", tags=["Programs"])

@router.get("/", response_model=List[schemas.ProgramOut])
async def get_my_programs(
    db: AsyncSession = Depends(get_db),
    client: User = Depends(require_client) # Assicura che sia loggato e cliente
):
    programs = await crud_programs.get_programs_for_client(db=db, client_id=client.id)
    return programs

@router.get("/active", response_model=schemas.ProgramOut)
async def get_my_active_program(
    db: AsyncSession = Depends(get_db),
    current_user = Depends(require_client) # L'utente loggato dal token
):
    """
    Restituisce la scheda attiva per il cliente loggato, 
    arricchita con lo storico e i diff rispetto alla scheda precedente.
    """
    # 1. Recupera l'oggetto ORM da SQLAlchemy
    program_orm = await crud_programs.get_active_program_for_client(db=db, client_id=current_user.id)
    if not program_orm:
        raise HTTPException(status_code=404, detail="Nessuna scheda attiva trovata")

    # 2. Converti l'oggetto ORM nel modello Pydantic 
    # (Questo usa `from_attributes=True` che hai in BaseSchema)
    program_out = schemas.ProgramOut.model_validate(program_orm)

    # 3. Arricchisci l'oggetto Pydantic con i calcoli del Diff e dello Storico
    # (Passiamo sia il DB che l'oggetto Pydantic da manipolare)
    enriched_program = await diff_service.enrich_program_with_diffs(
        db=db, 
        client_id=current_user.id, 
        program=program_out
    )

    return enriched_program

@router.get("/{client_id}/program", response_model=schemas.ProgramOut)
async def get_client_active_program(
    client_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    program = await crud_programs.get_active_program_for_client(db=db, client_id=client_id)
    if not program:
        raise HTTPException(status_code=404, detail="Nessuna scheda attiva trovata per questo cliente")
    
    if current_user.role == "client" and current_user.id != client_id:
        raise HTTPException(status_code=403, detail="Non sei autorizzato a vedere questa scheda")
    
    return program

@router.get("/{program_id}", response_model=schemas.ProgramOut)
async def get_program(
    program_id: int,
    db: AsyncSession = Depends(get_db)
):
    program = await crud_programs.get_program_by_id(db=db, program_id=program_id)
    if not program:
        raise HTTPException(status_code=404, detail="Scheda non trovata")
    return program

@router.post("/{client_id}/program", response_model=schemas.ProgramOut, status_code=201)
async def create_client_program(
    client_id: int,                      
    program_in: schemas.ProgramCreate,   
    db: AsyncSession = Depends(get_db),
    coach: User = Depends(require_coach)
):
    # Passiamo il client_id preso dall'URL direttamente al CRUD
    new_program = await crud_programs.create_nested_program(
        db=db, 
        program_data=program_in, 
        coach_id=coach.id, 
        client_id=client_id
    )
    return new_program

@router.patch("/{program_id}", response_model=schemas.ProgramOut)
async def patch_program(
    program_id: int,
    program_in: schemas.ProgramUpdate,
    db: AsyncSession = Depends(get_db),
    coach: User = Depends(require_coach)
):
    # 1. Controlliamo se la scheda esiste
    old_program = await crud_programs.get_program_by_id(db=db, program_id=program_id)
    if not old_program:
        raise HTTPException(status_code=404, detail="Scheda non trovata")
        
    # 2. Verifichiamo che appartenga al coach loggato
    if old_program.coach_id != coach.id:
        raise HTTPException(status_code=403, detail="Non sei autorizzato a modificare questa scheda")

    # 3. Eseguiamo l'aggiornamento
    updated_program = await crud_programs.update_program_metadata(
        db=db, 
        program_id=program_id, 
        program_in=program_in
    )
    
    # 4. Ricarichiamo l'albero completo per evitare il MissingGreenletError nella risposta
    # (Usiamo la stessa logica di caricamento ansioso vista per la GET)
    return await crud_programs.get_program_by_id(db=db, program_id=program_id)

@router.post("/{program_id}/new-version", response_model=schemas.ProgramOut, status_code=201)
async def create_new_program_version(
    program_id: int,
    program_in: schemas.ProgramCreate,
    db: AsyncSession = Depends(get_db),
    coach: User = Depends(require_coach)
):
    # 1. Controllo di sicurezza: la scheda di partenza esiste?
    old_program = await crud_programs.get_program_by_id(db=db, program_id=program_id)
    if not old_program:
        raise HTTPException(status_code=404, detail="Scheda di partenza non trovata")
        
    # 2. Controllo di proprietà: questa scheda appartiene al coach loggato?
    if old_program.coach_id != coach.id:
        raise HTTPException(status_code=403, detail="Non sei autorizzato a modificare questa scheda")

    # 3. Generiamo la nuova versione
    updated_program = await crud_programs.create_program_version(
        db=db,
        parent_program_id=program_id,
        program_data=program_in,
        coach_id=coach.id
    )
    
    return updated_program

@router.delete("/{program_id}", status_code=204)
async def delete_client_program(
    program_id: int,
    db: AsyncSession = Depends(get_db),
    coach: User = Depends(require_coach)
):
    program = await crud_programs.get_program_by_id(db, program_id)

    if not program:
        raise HTTPException(
            status_code=404, 
            detail="Scheda non trovata"
        )
    
    if program.coach_id != coach.id:
        raise HTTPException(
            status_code=403, 
            detail="Azione negata: non puoi eliminare una scheda creata da un altro coach"
        )

    await crud_programs.delete_program(db=db, program_id=program_id, coach_id=coach.id)
    return None # 204 No Content non ha body
