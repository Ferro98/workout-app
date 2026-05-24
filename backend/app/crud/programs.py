from sqlalchemy import delete, select, update
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from app import schemas

from ..models import User, Program, ProgramDay, ProgramExercise, TargetSet

async def get_programs_for_client(db: AsyncSession, client_id: int):
    """Estrae tutte le schede di uno specifico cliente."""
    stmt = (
            select(Program)
            .where(Program.client_id == client_id)
            .options(
                selectinload(Program.days)
                .selectinload(ProgramDay.exercises)
                .selectinload(ProgramExercise.exercise),
                
                selectinload(Program.days)
                .selectinload(ProgramDay.exercises)
                .selectinload(ProgramExercise.target_sets)
            )
        )
    result = await db.execute(stmt)
    return result.scalars().all()

async def get_active_program_for_client(db: AsyncSession, client_id: int):
    """Estrae la scheda attiva di uno specifico cliente."""
    stmt = (
            select(Program)
            .where(Program.client_id == client_id, Program.is_active == True)
            .options(
                selectinload(Program.days)
                .selectinload(ProgramDay.exercises)
                .selectinload(ProgramExercise.exercise),
                
                selectinload(Program.days)
                .selectinload(ProgramDay.exercises)
                .selectinload(ProgramExercise.target_sets)
            )
        )
    result = await db.execute(stmt)
    return result.scalar_one_or_none()

async def get_program_by_id(db: AsyncSession, program_id: int):
    stmt = (
        select(Program)
        .where(Program.id == program_id)
        .options(
            selectinload(Program.days).selectinload(ProgramDay.exercises).selectinload(ProgramExercise.exercise),
            selectinload(Program.days).selectinload(ProgramDay.exercises).selectinload(ProgramExercise.target_sets)
        )
    )
    result = await db.execute(stmt)
    return result.scalar_one_or_none()

async def create_nested_program(db: AsyncSession, program_data: schemas.ProgramCreate, coach_id: int, client_id: int):
    # 1. Disattiviamo le schede attive precedenti per il cliente
    await db.execute(
        update(Program)
        .where(Program.client_id == client_id, Program.is_active == True)
        .values(is_active=False)
    )

    # 2. Creiamo il Programma principale
    db_program = Program(
        name=program_data.name,
        coach_note=program_data.coach_note,
        coach_id=coach_id,
        client_id=client_id,
        is_active=True,
        version=1
    )

    # 3. Ricostruiamo la struttura ad albero
    for day_in in program_data.days:
        db_day = ProgramDay(
            day_index=day_in.day_index,
            name=day_in.name,
            focus=day_in.focus,
            coach_note=day_in.coach_note
        )

        for idx, ex_in in enumerate(day_in.exercises):
            db_exercise = ProgramExercise(
                exercise_id=ex_in.exercise_id,
                type=ex_in.type,
                sort_order=ex_in.sort_order,
                sets=ex_in.sets,
                reps=ex_in.reps,
                duration_sec=ex_in.duration_sec,
                rest_sec=ex_in.rest_sec,
                notes=ex_in.notes
            )

            for set_in in ex_in.target_sets:
                db_set = TargetSet(
                    set_index=set_in.set_index,
                    rpe=set_in.rpe,
                    reps=set_in.reps,
                    duration_sec=set_in.duration_sec,
                    tempo_per_rep=set_in.tempo_per_rep,
                    suggested_weight=set_in.suggested_weight,
                    rest_sec_override=set_in.rest_sec_override,
                    note=set_in.note
                )
                db_exercise.target_sets.append(db_set)
            
            db_day.exercises.append(db_exercise)
        
        db_program.days.append(db_day)

    # 4. Salviamo tutto a cascata
    db.add(db_program)
    await db.commit()
    
    # 5. Facciamo una SELECT finale "ansiosa" (Eager) per caricare tutto l'albero
    stmt = (
        select(Program)
        .where(Program.id == db_program.id)
        .options(
            selectinload(Program.days)
            .selectinload(ProgramDay.exercises)
            .selectinload(ProgramExercise.exercise), # Serve per name e type nello schema
            
            selectinload(Program.days)
            .selectinload(ProgramDay.exercises)
            .selectinload(ProgramExercise.target_sets) # Serve per le serie target
        )
    )
    
    result = await db.execute(stmt)
    return result.scalar_one()

async def update_program_metadata(db: AsyncSession, program_id: int, program_in: schemas.ProgramUpdate):
    # 1. Prepariamo il dizionario con i soli campi inviati dal frontend
    update_data = program_in.model_dump(exclude_unset=True)
    
    if not update_data:
        # Se il frontend ha inviato un body vuoto {}, recuperiamo solo la scheda attuale
        stmt = select(Program).where(Program.id == program_id)
        result = await db.execute(stmt)
        return result.scalar_one_or_none()

    # 2. Eseguiamo l'UPDATE sul database
    stmt = (
        update(Program)
        .where(Program.id == program_id)
        .values(**update_data)
        .returning(Program) # Ci facciamo restituire l'oggetto aggiornato (funziona su Postgres/Supabase)
    )
    
    result = await db.execute(stmt)
    await db.commit()
    return result.scalar_one_or_none()

async def create_program_version(
    db: AsyncSession, 
    parent_program_id: int, 
    program_data: schemas.ProgramCreate, 
    coach_id: int
):
    # 1. Recuperiamo la scheda "genitore" per verificare che esista e prendere il client_id
    parent_stmt = select(Program).where(Program.id == parent_program_id)
    parent_result = await db.execute(parent_stmt)
    parent_program = parent_result.scalar_one_or_none()
    
    if not parent_program:
        return None # Gestito poi dall'endpoint con un 404

    # 2. Disattiviamo la vecchia scheda (e qualsiasi altra scheda attiva per sicurezza)
    await db.execute(
        update(Program)
        .where(Program.client_id == parent_program.client_id, Program.is_active == True)
        .values(is_active=False)
    )

    # 3. Creiamo la NUOVA versione (il figlio)
    db_new_program = Program(
        name=program_data.name,
        coach_note=program_data.coach_note,
        coach_id=coach_id,
        client_id=parent_program.client_id, # Ereditato dal genitore
        is_active=True,                    # Diventa la scheda corrente
        parent_id=parent_program.id,        # Collegamento storico
        version=parent_program.version + 1  # Incrementiamo la versione (v2, v3...)
    )

    # 4. Ricostruiamo l'albero dei nuovi giorni/esercizi inviati dal frontend
    for day_in in program_data.days:
        db_day = ProgramDay(
            day_index=day_in.day_index,
            name=day_in.name,
            focus=day_in.focus,
            coach_note=day_in.coach_note
        )
        
        for ex_in in day_in.exercises:
            db_exercise = ProgramExercise(
                exercise_id=ex_in.exercise_id,
                type=ex_in.type,
                sort_order=ex_in.sort_order,
                sets=ex_in.sets,
                reps=ex_in.reps,
                duration_sec=ex_in.duration_sec,
                rest_sec=ex_in.rest_sec,
                notes=ex_in.notes
            )
            
            for set_in in ex_in.target_sets:
                db_set = TargetSet(
                    set_index=set_in.set_index,
                    rpe=set_in.rpe,
                    reps=set_in.reps,
                    duration_sec=set_in.duration_sec,
                    tempo_per_rep=set_in.tempo_per_rep,
                    suggested_weight=set_in.suggested_weight,
                    rest_sec_override=set_in.rest_sec_override,
                    note=set_in.note
                )
                db_exercise.target_sets.append(db_set)
            
            db_day.exercises.append(db_exercise)
        
        db_new_program.days.append(db_day)

    # 5. Salva tutto a cascata nel database
    db.add(db_new_program)
    await db.commit()
    
    # 6. Ricarichiamo l'albero completo (Eager Load) per evitare il MissingGreenletError in risposta
    from sqlalchemy.orm import selectinload
    stmt = (
        select(Program)
        .where(Program.id == db_new_program.id)
        .options(
            selectinload(Program.days).selectinload(ProgramDay.exercises).selectinload(ProgramExercise.exercise),
            selectinload(Program.days).selectinload(ProgramDay.exercises).selectinload(ProgramExercise.target_sets)
        )
    )
    result = await db.execute(stmt)
    return result.scalar_one()

async def delete_program(db: AsyncSession, program_id: int):
    stmt = delete(Program).where(Program.id == program_id)
    result = await db.execute(stmt)
    await db.commit()
    return result.rowcount > 0 # Restituisce True se ha eliminato qualcosa
