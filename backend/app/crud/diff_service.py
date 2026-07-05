from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app import schemas
from app.models import Program, ExerciseHistory
from app.crud.programs import get_previous_program
from app.crud.diff import compute_program_diff

# compute_program_diff usa 'added', gli schemi Pydantic usano 'new' — mappiamo qui una volta sola
_DIFF_TYPE_MAP = {
    "added": schemas.DiffStatus.NEW,
    "modified": schemas.DiffStatus.MODIFIED,
    "removed": schemas.DiffStatus.REMOVED,
    "unchanged": schemas.DiffStatus.UNCHANGED,
}


async def _get_last_weight_and_history(db: AsyncSession, client_id: int, exercise_id: int):
    """Recupera lo storico di un esercizio per un cliente, più recente prima."""
    stmt = (
        select(ExerciseHistory)
        .where(
            ExerciseHistory.client_id == client_id,
            ExerciseHistory.exercise_id == exercise_id,
        )
        .order_by(ExerciseHistory.date.desc())
    )
    result = await db.execute(stmt)
    rows = result.scalars().all()

    history = [schemas.HistoryEntry(date=r.date, detail=r.detail) for r in rows]
    last_weight = None
    if rows:
        # detail è tipo "80kg×8, 82.5kg×8, 82.5kg×7" -> prendiamo l'ultimo peso registrato
        last_weight = rows[0].detail.split(",")[-1].strip()

    return last_weight, history


async def enrich_program_with_diffs(
    db: AsyncSession,
    client_id: int,
    program_orm: Program,
) -> schemas.ProgramOut:
    """
    Riceve la scheda ORM (non Pydantic), calcola diff rispetto alla versione
    precedente e recupera lo storico pesi, poi converte tutto in ProgramOut
    iniettando i valori calcolati nei campi già previsti dallo schema.
    """
    # 1. Scheda precedente (None se è la prima versione)
    prev_program_orm = await get_previous_program(db, program_orm)

    diffs_by_exercise = {}
    if prev_program_orm:
        raw_diffs = compute_program_diff(prev_program_orm, program_orm)
        diffs_by_exercise = {d["exercise_id"]: d for d in raw_diffs}

    # 2. Mappa ProgramExercise.id (chiave usata da ProgramExerciseOut) -> oggetto ORM
    #    Serve per risalire da ogni esercizio Pydantic al suo "gemello" ORM
    orm_ex_by_pk = {
        ex.id: ex
        for day in program_orm.days
        for ex in day.exercises
    }

    # 3. Conversione in Pydantic (qui scattano gli alias camelCase)
    program_out = schemas.ProgramOut.model_validate(program_orm)

    # 4. Iniettiamo diff + storico in ogni esercizio della struttura già convertita
    for day_out in program_out.days:
        for ex_out in day_out.exercises:
            ex_orm = orm_ex_by_pk.get(ex_out.id)
            if ex_orm is None:
                continue

            raw = diffs_by_exercise.get(ex_orm.exercise_id)
            if raw:
                ex_out.diff = _DIFF_TYPE_MAP.get(raw["diff_type"], schemas.DiffStatus.UNCHANGED)
                ex_out.diff_items = [schemas.DiffItem(**c) for c in raw["changes"]]
                ex_out.set_diffs = [
                    schemas.SetDiff(
                        set_index=sd["set_index"],
                        status=_DIFF_TYPE_MAP.get(sd["status"], schemas.DiffStatus.UNCHANGED),
                        changes=[schemas.DiffItem(**c) for c in sd["changes"]],
                    )
                    for sd in raw["set_diffs"]
                ]

            last_weight, history = await _get_last_weight_and_history(
                db, client_id, ex_orm.exercise_id
            )
            ex_out.last_weight = last_weight
            ex_out.history = history

    return program_out