from datetime import datetime
from collections import defaultdict
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from sqlalchemy import select
from app.models import Session, SessionSet, ExerciseHistory, ProgramExercise
from app import schemas

async def create_workout_session(db: AsyncSession, client_id: int, session_in: schemas.SessionCreate):
    # 1. Creiamo l'entità Session base
    db_session = Session(
        client_id=client_id,
        program_id=session_in.program_id,
        day_id=session_in.day_id,
        started_at=session_in.started_at,
        ended_at=session_in.ended_at,
        duration_sec=session_in.duration_seconds,
        general_note=session_in.general_note
    )

    # Mappa temporanea per ricordarci quali program_exercise_id stiamo salvando
    pe_ids = set()

    # 2. Iteriamo sui dati ANNIDATI (Esercizi -> Set) ricevuti dal frontend
    for exercise_in in session_in.exercises:
        pe_id = exercise_in.program_exercise_id
        pe_ids.add(pe_id)
        
        # Srotoliamo le serie (sets) interne a ogni esercizio
        for set_in in exercise_in.sets:
            db_set = SessionSet(
                program_exercise_id=pe_id,  # Lo prendiamo dall'esercizio "padre"
                set_index=set_in.set_index,
                completed=set_in.completed,
                actual_reps=set_in.actual_reps,
                actual_weight=set_in.actual_weight,
                actual_rir=set_in.actual_rir,
                note=set_in.note
            )
            # Aggiungiamo la serie alla sessione
            db_session.sets.append(db_set)

    # Salviamo la sessione e i set a cascata per generare gli ID (fondamentali per la history)
    db.add(db_session)
    await db.flush() # Usiamo flush() invece di commit() così teniamo la transazione aperta

    # 3. LOGICA DI STORICIZZAZIONE (ExerciseHistory)
    if pe_ids:
        # Recuperiamo gli exercise_id reali mappati dentro program_exercises
        pe_stmt = select(ProgramExercise).where(ProgramExercise.id.in_(pe_ids))
        pe_result = await db.execute(pe_stmt)
        # Creiamo un dizionario di lookup rapido: program_exercise_id -> exercise_id
        pe_to_ex_map = {pe.id: pe.exercise_id for pe in pe_result.scalars().all()}

        # Raggruppiamo i set appena inseriti per exercise_id reale
        history_builder = defaultdict(list)
        for s in db_session.sets:
            if s.completed: # Salviamo nello storico solo i set portati a termine
                real_ex_id = pe_to_ex_map.get(s.program_exercise_id)
                if real_ex_id:
                    # Prepariamo il pezzettino di stringa (es: "80kg×8")
                    weight_str = f"{s.actual_weight or 0}kg"
                    reps_str = f"×{s.actual_reps or 0}"
                    history_builder[real_ex_id].append(f"{weight_str}{reps_str}")

        # Generiamo le righe di ExerciseHistory
        session_date_str = db_session.started_at.strftime("%Y-%m-%d")
        
        for real_ex_id, string_list in history_builder.items():
            if string_list:
                # Uniamo i set separandoli con una virgola (es: "80kg×8, 82.5kg×8, 82.5kg×7")
                detail_str = ", ".join(string_list)
                
                db_history = ExerciseHistory(
                    client_id=client_id,
                    exercise_id=real_ex_id,
                    session_id=db_session.id,
                    date=session_date_str,
                    detail=detail_str
                )
                db.add(db_history)

    # 4. Chiudiamo definitivamente la transazione su database
    await db.commit()

    # 5. Eager Loading per la risposta da restituire al frontend (WorkoutSessionOut)
    stmt = (
        select(Session)
        .where(Session.id == db_session.id)
        .options(
            selectinload(Session.program),
            selectinload(Session.day),
            selectinload(Session.sets)
        )
    )
    result = await db.execute(stmt)
    return result.scalar_one()