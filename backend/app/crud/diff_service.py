from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app import schemas

async def enrich_program_with_diffs(
    db: AsyncSession, 
    client_id: int, 
    program: schemas.ProgramOut
) -> schemas.ProgramOut:
    """
    Prende una scheda Pydantic e inietta i dati di diff calcolandoli dallo storico del database.
    """
    
    # 1. (Opzionale) Recupera la scheda PRECEDENTE per calcolare i diff strutturali
    # prev_program = await crud_programs.get_previous_program(...)
    
    # Navighiamo l'oggetto Pydantic che stiamo per inviare al frontend
    for day in program.days:
        for ex in day.exercises:
            # -----------------------------------------------------------
            # A. ESEMPIO LOGICA DIFF (Confronto con scheda precedente)
            # -----------------------------------------------------------
            # Se hai 'prev_program', cerchi se questo exercise_id c'era già.
            # Qui simulo una logica fittizia per mostrarti come popolare i DTO:
            
            is_new_exercise = False # Sostituisci con la tua logica (es. ex.exercise_id non in prev_program)
            
            if is_new_exercise:
                ex.diff = schemas.DiffStatus.NEW
            else:
                # Esempio: Il coach ha aumentato le serie da 3 a 4
                # if ex.sets > old_ex.sets:
                #     ex.diff = schemas.DiffStatus.MODIFIED
                #     ex.diff_items.append(
                #         schemas.DiffItem(field="sets", label="Serie", prev=3, curr=4)
                #     )
                pass # Rimuovi quando implementi la tua logica

            # -----------------------------------------------------------
            # B. ESEMPIO LOGICA LAST WEIGHT (Recupero da Sessioni passate)
            # -----------------------------------------------------------
            # Idealmente fai una query al DB: "Dammi l'ultimo WorkoutSet per questo exercise_id e questo client_id"
            # last_session_set = await crud_workouts.get_last_set_for_exercise(db, client_id, ex.exercise_id)
            
            # Se lo trovi, lo inietti:
            # if last_session_set:
            #     ex.last_weight = last_session_set.actual_weight
            
            # -----------------------------------------------------------
            # C. ESEMPIO LOGICA HISTORY
            # -----------------------------------------------------------
            # Aggiungi le ultime note o performance storiche
            # ex.history.append(
            #     schemas.HistoryEntry(date="2023-10-12", detail="Completato 4x8 @ 80kg (RPE 8)")
            # )
            
            pass # Rimuovi pass quando inserisci i tuoi dati

    return program