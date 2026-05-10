# GymCoach App

App mobile-first per la gestione delle schede di allenamento tra coach e cliente.  
Il coach crea e modifica le schede, il cliente le visualizza e le "avvia" in palestra con timer, log delle serie e note.

---

## Stack tecnico

| Layer        | Tecnologia                   | Note                                     |
| ------------ | ---------------------------- | ---------------------------------------- |
| Frontend     | React 18 + TypeScript + Vite | PWA installabile su iOS/Android          |
| Stili        | Tailwind CSS v4              | Dark mode via `prefers-color-scheme`     |
| Routing      | React Router v6              | Layout separati per ruolo                |
| Icone        | @tabler/icons-react          | Outline, stroke uniforme                 |
| Backend      | FastAPI (Python)             | REST + JWT auth                          |
| ORM          | SQLAlchemy 2.0 async         | Con Alembic per le migrazioni            |
| Database     | PostgreSQL                   | Hosted su Railway / Render / VPS         |
| Auth         | python-jose + passlib/bcrypt | JWT con campo `role` nel payload         |
| Cache (opz.) | Redis                        | Sessioni attive, stato workout real-time |

---

## Struttura frontend

```
src/
├── components/
│   ├── layout/
│   │   ├── TopBar.tsx          # Header con titolo e slot destro
│   │   └── TabBar.tsx          # Nav bottom, cambia tab in base al ruolo
│   └── scheda/
│       ├── ExerciseCard.tsx    # Card espandibile con diff, storico, nota coach
│       ├── CoachNoteBanner.tsx # Banner viola nota generale coach
│       └── DiffBadge.tsx       # Pill o pallino per status diff
├── pages/
│   ├── client/
│   │   ├── SchedaPage.tsx      # ✅ Fatto
│   │   ├── WorkoutPage.tsx     # Timer, tick serie, recupero, note
│   │   ├── StoricoPag e.tsx    # Lista sessioni + statistiche
│   │   └── EserciziPage.tsx    # DB esercizi con filtro e aggiunta
│   └── coach/
│       ├── ClientiPage.tsx     # Lista clienti con stato
│       ├── EditorPage.tsx      # Editor scheda per cliente
│       └── NotePage.tsx        # Visualizzazione feedback clienti
├── types/
│   └── index.ts                # Tutti i tipi TypeScript condivisi
├── data/
│   └── mock.ts                 # Dati mock per sviluppo UI
├── App.tsx                     # Routing + layout shell
└── index.css                   # Tailwind + safe-area
```

---

## Ruoli e routing

Il ruolo (`client` | `coach`) viene decodificato dal JWT al login e messo in un `AuthContext`.  
`App.tsx` usa il ruolo per scegliere quale set di route e quale `TabBar` mostrare.  
Un utente client non vede mai le route coach e viceversa — il redirect di default va alla prima tab del proprio ruolo.

```
MOCK_ROLE in App.tsx → in produzione: useAuth().role
```

**Tab cliente:** Scheda · Allena · Storico · Esercizi · Profilo  
**Tab coach:** Clienti · Schede · Esercizi · Profilo

---

## Schema database

```sql
-- Utenti (coach e clienti sulla stessa tabella, distinti da role)
CREATE TABLE users (
  id            SERIAL PRIMARY KEY,
  email         TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  full_name     TEXT NOT NULL,
  role          TEXT NOT NULL CHECK (role IN ('client', 'coach')),
  coach_id      INTEGER REFERENCES users(id),  -- NULL se è un coach
  created_at    TIMESTAMPTZ DEFAULT now()
);

-- Database esercizi (condiviso, estendibile da ogni coach)
CREATE TABLE exercises (
  id          SERIAL PRIMARY KEY,
  name        TEXT NOT NULL,
  category    TEXT NOT NULL CHECK (category IN ('chest','back','legs','shoulders','arms','core')),
  type        TEXT NOT NULL CHECK (type IN ('weight','bodyweight','timed','timed_weight')),
  created_by  INTEGER REFERENCES users(id),  -- NULL = esercizio di sistema
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- Schede di allenamento
CREATE TABLE programs (
  id          SERIAL PRIMARY KEY,
  client_id   INTEGER NOT NULL REFERENCES users(id),
  coach_id    INTEGER NOT NULL REFERENCES users(id),
  name        TEXT NOT NULL,              -- es. "Scheda A"
  focus       TEXT,                       -- es. "Petto / Tricipiti"
  coach_note  TEXT,                       -- nota generale visibile al cliente
  is_active   BOOLEAN DEFAULT true,
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- Esercizi dentro una scheda (con tutti i parametri)
CREATE TABLE program_exercises (
  id             SERIAL PRIMARY KEY,
  program_id     INTEGER NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
  exercise_id    INTEGER NOT NULL REFERENCES exercises(id),
  sort_order     INTEGER NOT NULL DEFAULT 0,
  sets           INTEGER NOT NULL,
  reps           INTEGER,                 -- NULL per esercizi timed
  duration_sec   INTEGER,                 -- NULL per esercizi a ripetizioni
  rpe            INTEGER CHECK (rpe BETWEEN 1 AND 10),
  rest_sec       INTEGER NOT NULL DEFAULT 90,
  coach_note     TEXT                     -- nota specifica sull'esercizio
);

-- Sessioni di allenamento avviate dal cliente
CREATE TABLE sessions (
  id            SERIAL PRIMARY KEY,
  client_id     INTEGER NOT NULL REFERENCES users(id),
  program_id    INTEGER NOT NULL REFERENCES programs(id),
  started_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  ended_at      TIMESTAMPTZ,
  general_note  TEXT
);

-- Singole serie completate (o saltate) durante una sessione
CREATE TABLE session_sets (
  id                   SERIAL PRIMARY KEY,
  session_id           INTEGER NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  program_exercise_id  INTEGER NOT NULL REFERENCES program_exercises(id),
  set_index            INTEGER NOT NULL,   -- 0-based
  completed            BOOLEAN DEFAULT false,
  actual_reps          INTEGER,
  actual_weight        TEXT,               -- es. "82.5 kg" — testo libero per flessibilità
  note                 TEXT,
  logged_at            TIMESTAMPTZ DEFAULT now()
);
```

### Note sullo schema

- `actual_weight` è `TEXT` per permettere valori come "corpo libero", "banda media", "20+5 kg" senza forzare un tipo numerico rigido.
- Quando il coach crea una nuova versione di una scheda, si crea un nuovo record in `programs` (con `is_active = true` sul nuovo, `false` sul vecchio). Il confronto diff si calcola lato backend confrontando i `program_exercises` delle due versioni.
- `coach_id` in `programs` permette a un coach di avere più clienti; un cliente ha sempre un solo coach attivo (si può estendere con una tabella di relazione se serve molti-a-molti).

---

## API backend (FastAPI) — endpoint principali

```
POST   /auth/login                    → { access_token, role }
POST   /auth/register

GET    /programs/current              → program attivo del cliente loggato
GET    /programs/{id}/diff            → diff vs versione precedente
GET    /programs/client/{client_id}   → [coach] tutte le schede di un cliente
POST   /programs                      → [coach] crea nuova scheda
PATCH  /programs/{id}                 → [coach] modifica coach_note, name, focus
POST   /programs/{id}/exercises       → [coach] aggiungi esercizio
PATCH  /programs/{id}/exercises/{eid} → [coach] modifica parametri esercizio
DELETE /programs/{id}/exercises/{eid} → [coach] rimuovi esercizio

GET    /exercises                     → lista DB esercizi (filtro per category/type)
POST   /exercises                     → aggiungi esercizio custom
PATCH  /exercises/{id}                → modifica esercizio (solo chi l'ha creato)

POST   /sessions                      → avvia sessione
PATCH  /sessions/{id}                 → chiudi sessione (ended_at, general_note)
POST   /sessions/{id}/sets            → logga una serie
GET    /sessions/me                   → storico sessioni del cliente loggato
GET    /sessions/client/{client_id}   → [coach] storico di un cliente

GET    /clients                       → [coach] lista clienti
GET    /clients/{id}                  → [coach] dettaglio cliente + scheda attiva
```

---

## Struttura backend consigliata

```
backend/
├── app/
│   ├── api/
│   │   ├── auth.py
│   │   ├── programs.py
│   │   ├── exercises.py
│   │   ├── sessions.py
│   │   └── clients.py
│   ├── models/         ← SQLAlchemy ORM (specchiano lo schema sopra)
│   ├── schemas/        ← Pydantic v2 (request/response)
│   ├── services/
│   │   ├── diff.py     ← logica confronto tra versioni scheda
│   │   └── stats.py    ← aggregazioni storico (volume, frequenza...)
│   ├── auth.py         ← JWT encode/decode, dipendenza get_current_user
│   └── db.py           ← async engine + sessione SQLAlchemy
├── alembic/            ← migrazioni versionate
├── alembic.ini
├── requirements.txt
└── main.py
```

### Dipendenze Python

```
fastapi
uvicorn[standard]
sqlalchemy[asyncio]
asyncpg
alembic
pydantic[email]
python-jose[cryptography]
passlib[bcrypt]
python-dotenv
```

---

## Logica diff tra schede

La diff si calcola nel servizio `services/diff.py` confrontando i `program_exercises` di due versioni della stessa scheda.

```python
def compute_diff(old_exercises, new_exercises):
    old_map = {e.exercise_id: e for e in old_exercises}
    new_map = {e.exercise_id: e for e in new_exercises}

    result = []
    for ex_id, new_ex in new_map.items():
        if ex_id not in old_map:
            result.append({ "status": "new", "exercise_id": ex_id, "diff_items": [] })
        else:
            old_ex = old_map[ex_id]
            items = []
            for field, label in [("sets","Serie"),("reps","Ripetizioni"),("rpe","RPE"),("rest_sec","Recupero")]:
                if getattr(old_ex, field) != getattr(new_ex, field):
                    items.append({ "field": field, "label": label,
                                   "prev": getattr(old_ex, field),
                                   "curr": getattr(new_ex, field) })
            status = "modified" if items else "unchanged"
            result.append({ "status": status, "exercise_id": ex_id, "diff_items": items })

    for ex_id in old_map:
        if ex_id not in new_map:
            result.append({ "status": "removed", "exercise_id": ex_id, "diff_items": [] })

    return result
```

---

## Dark mode

Tailwind v4 usa `prefers-color-scheme` automaticamente con le classi `dark:`.  
Non serve configurazione aggiuntiva per il comportamento di default.

Per aggiungere un **toggle manuale** in futuro:

1. In `tailwind.css` aggiungi `@variant dark (&:where(.dark, .dark *));`
2. Crea un `ThemeContext` che salva la preferenza in `localStorage`
3. Applica la classe `dark` su `<html>` in base al valore del context

---

## PWA (installabile su mobile)

Per rendere l'app installabile come app nativa su iOS/Android:

1. Aggiungi `vite-plugin-pwa` al progetto:
   ```bash
   npm install -D vite-plugin-pwa
   ```
2. Configura in `vite.config.ts` con `manifest` (nome, icone, colori, `display: 'standalone'`)
3. Il `TabBar` già usa `pb-safe` per rispettare la safe-area dei dispositivi con notch

---

## Prossimi passi frontend

- [ ] `WorkoutPage` — timer allenamento, tick serie, overlay recupero, note per esercizio
- [ ] `StoricoPag e` — lista sessioni raggruppate per mese, statistiche aggregate
- [ ] `EserciziPage` — DB esercizi con filtro categoria, ricerca, aggiunta custom
- [ ] `ClientiPage` (coach) — lista clienti con stato attivo/inattivo
- [ ] `EditorPage` (coach) — editor scheda inline, aggiunta/rimozione esercizi
- [ ] `AuthContext` + pagina login — replace di `MOCK_ROLE` con JWT reale
- [ ] Toggle dark mode manuale nel profilo

## Prossimi passi backend

- [ ] Setup progetto FastAPI con struttura descritta sopra
- [ ] Modelli SQLAlchemy dallo schema DB
- [ ] Alembic migration iniziale
- [ ] Endpoint auth (login, register, refresh)
- [ ] CRUD schede e sessioni
- [ ] Servizio diff
- [ ] Deploy su Railway (database + backend nello stesso progetto)