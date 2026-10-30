import asyncio
from datetime import datetime, timezone
from sqlalchemy import select, text
from sqlalchemy.ext.asyncio import AsyncSession

# I tuoi import nativi
from app.db import AsyncSessionLocal
from app.models import User, Exercise, Program, ProgramDay, ProgramExercise, TargetSet
from app.auth import hash_password

CATALOG_EXERCISES: list[dict[str, str]] = [
    {"name": "Panca Piana Bilanciere", "category": "chest", "type": "weight"},
    {"name": "Panca Inclinata Manubri", "category": "chest", "type": "weight"},
    {"name": "Croci Cavi Alti", "category": "chest", "type": "weight"},
    {"name": "Dip alle Parallele", "category": "chest", "type": "bodyweight"},
    {"name": "Pec Deck", "category": "chest", "type": "weight"},
    {"name": "Trazioni Lat Machine", "category": "back", "type": "weight"},
    {"name": "Trazioni alla Sbarra", "category": "back", "type": "bodyweight"},
    {"name": "Rematore Bilanciere", "category": "back", "type": "weight"},
    {"name": "Rematore Manubrio", "category": "back", "type": "weight"},
    {"name": "Pulley Basso", "category": "back", "type": "weight"},
    {"name": "Stacco da Terra", "category": "back", "type": "weight"},
    {"name": "Squat Bilanciere", "category": "legs", "type": "weight"},
    {"name": "Leg Press", "category": "legs", "type": "weight"},
    {"name": "Affondi Manubri", "category": "legs", "type": "weight"},
    {"name": "Leg Extension", "category": "legs", "type": "weight"},
    {"name": "Leg Curl", "category": "legs", "type": "weight"},
    {"name": "Calf Raises", "category": "legs", "type": "weight"},
    {"name": "Lento Avanti Bilanciere", "category": "shoulders", "type": "weight"},
    {"name": "Arnold Press", "category": "shoulders", "type": "weight"},
    {"name": "Alzate Laterali", "category": "shoulders", "type": "weight"},
    {"name": "Face Pull", "category": "shoulders", "type": "weight"},
    {"name": "Curl Bilanciere", "category": "arms", "type": "weight"},
    {"name": "Curl Manubri Alternato", "category": "arms", "type": "weight"},
    {"name": "Push-down Cavo", "category": "arms", "type": "weight"},
    {"name": "French Press", "category": "arms", "type": "weight"},
    {"name": "Plank Addominale", "category": "core", "type": "timed"},
    {"name": "Crunch", "category": "core", "type": "bodyweight"},
    {"name": "Russian Twist", "category": "core", "type": "bodyweight"},
    {"name": "Leg Raise", "category": "core", "type": "bodyweight"},
    {"name": "Ab Wheel", "category": "core", "type": "bodyweight"},
]

async def fix_postgres_sequences(db: AsyncSession):
    """Ripristina i contatori degli ID se il DB contiene già dei dati"""
    tables = ["users", "exercises", "programs", "program_days", "program_exercises", "target_sets"]
    print("🔄 Riallineamento dei contatori ID (Sequences) in corso...")
    for table in tables:
        try:
            await db.execute(text(f"""
                SELECT setval(
                    pg_get_serial_sequence('{table}', 'id'), 
                    COALESCE((SELECT MAX(id) FROM {table}), 1), 
                    (SELECT MAX(id) FROM {table}) IS NOT NULL
                );
            """))
        except Exception:
            # Se una tabella non ha una sequenza standard, passiamo oltre senza bloccare lo script
            pass
    await db.flush()

async def seed_exercises(db: AsyncSession) -> dict[str, Exercise]:
    """Inserts the exercises catalog inside the db and returns the map name -> object"""
    print("📚 Controllo catalogo esercizi...")
    names = [ex["name"] for ex in CATALOG_EXERCISES]
    res = await db.execute(select(Exercise).where(Exercise.name.in_(names)))
    existing = res.scalars().all()
    exercise_map = {e.name: e for e in existing}

    new_exercises: list[Exercise] = []
    for ex in CATALOG_EXERCISES:
        if ex["name"] not in exercise_map:
            ex_obj = Exercise(
                name=ex["name"],
                category=ex["category"],
                type=ex["type"],
                created_by=None
            )
            new_exercises.append(ex_obj)
            exercise_map[ex["name"]] = ex_obj
            print(f"➕ Creato: {ex['name']}")
    if new_exercises:
        db.add_all(new_exercises)
        await db.flush()
    created, existing_count = len(new_exercises), len(CATALOG_EXERCISES)
    print(f"📚 Catalogo esercizi: {created} creati, {existing_count - created} già presenti (totale {existing_count})")
    return exercise_map


async def seed_data():
    print("🚀 Inizio popolamento database...")
    
    async with AsyncSessionLocal() as db:
        # 0. Sistemiamo i contatori di Postgres prima di fare qualsiasi operazione
        await fix_postgres_sequences(db)
        
        # Generiamo l'hash della tua password predefinita
        hashed_pwd = hash_password("password123")
        
        # 1. Gestione del Coach (get_or_create)
        result_coach = await db.execute(select(User).where(User.email == "coach@test.com"))
        coach = result_coach.scalar_one_or_none()
        
        if not coach:
            coach = User(
                email="coach@test.com",
                password_hash=hashed_pwd,
                full_name="Alessandro Coach",
                role="coach",
                is_active=True,
                color_bg="#1e293b",
                color_text="#ffffff"
            )
            db.add(coach)
            await db.flush()
            print(f"Coach creato con ID: {coach.id}")
        else:
            print(f"Coach già presente (ID: {coach.id}), procedo...")

        # 2. Gestione del Cliente collegato (get_or_create)
        result_client = await db.execute(select(User).where(User.email == "cliente@test.com"))
        client = result_client.scalar_one_or_none()
        
        if not client:
            client = User(
                email="cliente@test.com",
                password_hash=hashed_pwd,
                full_name="Mario Rossi",
                role="client",
                coach_id=coach.id,
                is_active=True,
                color_bg="#3b82f6",
                color_text="#ffffff"
            )
            db.add(client)
            await db.flush()
            print(f"Cliente creato con ID: {client.id}")
        else:
            print(f"Cliente già presente (ID: {client.id}), procedo...")

        # 3. Gestione Esercizi Master (Evitiamo duplicati sul nome)
        exercise_map = await seed_exercises(db)

        # 4. Creazione della nuova Scheda d'allenamento di test
        timestamp = datetime.now().strftime("%d/%m %H:%M")
        program = Program(
            client_id=client.id,
            coach_id=coach.id,
            name=f"Scheda Forza & Volume ({timestamp})",
            coach_note="Focalizzati sulla tensione meccanica. Recuperi tassativi.",
            is_active=True,
            version=1
        )
        db.add(program)
        await db.flush()

        # ── GIORNO A (Spinta) ──
        day_a = ProgramDay(
            program_id=program.id,
            day_index=0,
            name="Giorno A",
            focus="Spinta (Petto/Spalle)",
            coach_note="Riscaldamento articolare accurato per i rotatori."
        )
        db.add(day_a)
        await db.flush()

        # Esercizio: Panca Piana
        ex_panca = exercise_map["Panca Piana Bilanciere"]
        pe_panca = ProgramExercise(
            day_id=day_a.id,
            exercise_id=ex_panca.id,
            sort_order=0,
            type=ex_panca.type,
            sets=3,
            reps=8,
            rest_sec=120,
            notes="Leg drive attivo, spalle depresse."
        )
        db.add(pe_panca)
        await db.flush()

        # Target Sets associati
        ts_p1 = TargetSet(program_exercise_id=pe_panca.id, set_index=0, rpe=8, reps=8, suggested_weight="80", tempo_per_rep="3-1-1-0")
        ts_p2 = TargetSet(program_exercise_id=pe_panca.id, set_index=1, rpe=8, reps=8, suggested_weight="80", tempo_per_rep="3-1-1-0")
        ts_p3 = TargetSet(program_exercise_id=pe_panca.id, set_index=2, rpe=9, reps=7, suggested_weight="82.5", tempo_per_rep="3-1-1-0", note="Mantenere tecnica pulita")
        db.add_all([ts_p1, ts_p2, ts_p3])

        # ── GIORNO B (Trazione & Core) ──
        day_b = ProgramDay(
            program_id=program.id,
            day_index=1,
            name="Giorno B",
            focus="Trazione & Core",
            coach_note=None
        )
        db.add(day_b)
        await db.flush()

        # Esercizio: Trazioni alla sbarra
        ex_traz = exercise_map["Trazioni alla Sbarra"]
        pe_traz = ProgramExercise(
            day_id=day_b.id,
            exercise_id=ex_traz.id,
            sort_order=0,
            type=ex_traz.type,
            sets=2,
            reps=6,
            rest_sec=90,
            notes="Arriva con il mento sopra la sbarra in modo controllato."
        )
        db.add(pe_traz)
        await db.flush()

        ts_t1 = TargetSet(program_exercise_id=pe_traz.id, set_index=0, rpe=8, reps=6, note="A corpo libero")
        ts_t2 = TargetSet(program_exercise_id=pe_traz.id, set_index=1, rpe=8, reps=6)
        db.add_all([ts_t1, ts_t2])

        # Esercizio: Plank (A Tempo)
        ex_plank = exercise_map["Plank Addominale"]
        pe_plank = ProgramExercise(
            day_id=day_b.id,
            exercise_id=ex_plank.id,
            sort_order=1,
            type=ex_plank.type,
            sets=1,
            duration_sec=60,
            rest_sec=60,
            notes="Evita l'iperlordosi, stringi glutei e addome."
        )
        db.add(pe_plank)
        await db.flush()

        ts_pl1 = TargetSet(program_exercise_id=pe_plank.id, set_index=0, rpe=7, duration_sec=60)
        db.add(ts_pl1)

        # Commit finale unico della transazione
        await db.commit()
        
        print("\n✅ Database popolato e sincronizzato con successo!")
        print(f"📊 Creata nuova scheda: '{program.name}'")
        print("📧 Email Coach: coach@test.com | 🔑 Pass: password123")
        print("📧 Email Cliente: cliente@test.com | 🔑 Pass: password123")

if __name__ == "__main__":
    asyncio.run(seed_data())