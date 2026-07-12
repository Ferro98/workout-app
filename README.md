# GymCoach

App mobile-first per la gestione delle schede di allenamento tra **coach** e **cliente**.
Il coach crea e versiona le schede, il cliente le esegue in palestra loggando le serie svolte e vede lo storico dei pesi/performance nel tempo.

Monorepo con due progetti indipendenti:

```
.
├── backend/    FastAPI + PostgreSQL (async)
└── frontend/   React + TypeScript + Vite (PWA)
```

> Questo README descrive lo **stato reale** del codice in questo repository, non un piano. La sezione [Stato del progetto](#stato-del-progetto) e [Prossimi passi](#prossimi-passi) sono la fonte di verità più aggiornata su cosa funziona e cosa manca.

---

## Stack tecnico

| Layer        | Tecnologia                            | Note                                                  |
| ------------ | ------------------------------------- | ----------------------------------------------------- |
| Frontend     | React 19 + TypeScript + Vite          | PWA (`vite-plugin-pwa`), installabile su mobile       |
| Stili        | Tailwind CSS v4                       | Dark mode via `prefers-color-scheme`                  |
| Routing      | React Router v6                       | Route separate per ruolo (`client` / `coach`)         |
| Icone        | `@tabler/icons-react`, `lucide-react` | —                                                     |
| Backend      | FastAPI (async)                       | REST + JWT auth                                       |
| ORM          | SQLAlchemy 2.0 async                  | `AsyncSession`, `Mapped[...]`, `selectinload`         |
| Migrazioni   | Alembic                               | Migrazioni versionate in `backend/alembic/versions`   |
| Database     | PostgreSQL (Supabase in dev)          | `backend/ping_supabase.py` per evitare l'auto-pausa   |
| Auth         | `python-jose` + `bcrypt`              | JWT con `sub`/`role`/`exp`, OAuth2 password flow      |
| Package mgmt | `uv` (backend) · `npm` (frontend)     | Vedi `backend/uv.lock` / `frontend/package-lock.json` |

---

## Stato del progetto

Legenda: ✅ funzionante e collegato end-to-end · 🟡 implementato parzialmente / con bug noti · ⬜ non ancora implementato

| Funzionalità                                  | Backend | Frontend | Note                                                                                                                                                                                                                                           |
| --------------------------------------------- | :-----: | :------: | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Registrazione / Login (JWT)                   |    ✅    |    🟡     | Backend ok. Il frontend fa **auto-login con credenziali hardcoded** (`coach@test.com`) invece di una vera pagina di login — vedi [Problemi noti](#problemi-noti).                                                                              |
| Profilo utente (`/auth/me`)                   |    ✅    |    🟡     | Il backend torna già camelCase (`fullName`), ma il tipo TS `UserMe` dichiara ancora `name` → il nome utente risulta `undefined` a runtime.                                                                                                     |
| Lista clienti (coach)                         |    ✅    |    ✅     | `ClientiPage` collegata a `GET /api/clients/`.                                                                                                                                                                                                 |
| Scheda attiva (cliente)                       |    ✅    |    ✅     | `SchedaPage` collegata a `GET /api/programs/active`.                                                                                                                                                                                           |
| Editor scheda / nuova versione (coach)        |    ✅    |    ✅     | `EditorPage` + `SchemaEditor`, invio albero completo giorni→esercizi→set.                                                                                                                                                                      |
| Diff tra versioni scheda                      |    ✅    |    ✅     | `diff.py` calcola il confronto, `diff_service.py` lo inietta in `GET /api/programs/active`; `DiffBadge`/`ExerciseCard` lo mostrano già.                                                                                                        |
| Storico pesi per esercizio                    |    ✅    |    ✅     | Popolato da `crud/sessions.py` in `ExerciseHistory`, esposto via diff_service.                                                                                                                                                                 |
| Esecuzione allenamento (timer, set, recupero) |    —    |    ✅     | `WorkoutPage` + `WorkoutContext`, UI completa e funzionante localmente.                                                                                                                                                                        |
| **Salvataggio sessione allenamento**          |    ✅    |    🟡     | L'endpoint `POST /api/clients/{id}/sessions` e `sessionService.createSession` sono corretti e allineati, **ma nessuna pagina li chiama ancora**: `WorkoutPage.finish()` non invia la sessione al backend. È il gap più importante da chiudere. |
| Pagina Storico allenamenti (cliente)          |    —    |    ⬜     | `StoricoPage.tsx` è vuota, route mostra un placeholder.                                                                                                                                                                                        |
| Pagina Note coach                             |    —    |    ⬜     | `NotePage.tsx` è vuota, route mostra un placeholder.                                                                                                                                                                                           |
| CRUD esercizi (catalogo)                      |    ⬜    |    🟡     | Router `exercises.py` esiste ma è **disattivato** in `main.py` ed espone solo un endpoint dummy. `EserciziPage` funziona ma legge da un array mock (`data/mock.ts`), non dal DB.                                                               |
| Ownership coach → cliente                     |    ✅    |    ✅     | Verificata su tutti gli endpoint principali (vedi fix elencati sotto).                                                                                                                                                                         |

---

## Setup

### Backend

Richiede Python ≥ 3.11 e [uv](https://docs.astral.sh/uv/).

```bash
cd backend
cp .env.example .env      # poi compila i valori, vedi tabella sotto
uv sync
uv run alembic upgrade head
uv run python -m app.seed   # crea coach@test.com / password123 + dati demo
uv run fastapi dev app/main.py
```

L'API è disponibile su `http://localhost:8000`, Swagger su `http://localhost:8000/docs`.

#### Variabili d'ambiente (`backend/.env`)

| Variabile                     | Obbligatoria | Descrizione                                                                                                                                          |
| ----------------------------- | :----------: | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| `DATABASE_URL`                |      ✅       | Connection string async, es. `postgresql+asyncpg://user:pass@host:5432/dbname`                                                                       |
| `DATABASE_PASS`               |      —       | Password del database, tenuta separata per comodità/rotazione; **non ancora letta dal codice**, che si aspetta la password già dentro `DATABASE_URL` |
| `SECRET_KEY`                  |      ✅       | Chiave per firmare i JWT (`app/auth.py`, va in errore all'avvio se assente)                                                                          |
| `ALGORITHM`                   |      ✅       | Algoritmo JWT, es. `HS256`                                                                                                                           |
| `ACCESS_TOKEN_EXPIRE_MINUTES` |      ✅       | Durata del token in minuti                                                                                                                           |
| `TEST_DATABASE_URL`           |      —       | Riservata per una futura suite di test contro un DB separato; **non ancora usata** dal codice                                                        |

Vedi `backend/.env.example`.

### Frontend

Richiede Node ≥ 18.

```bash
cd frontend
npm install
npm run dev
```

L'app gira su `http://localhost:5173` e si aspetta il backend su `http://localhost:8000` (hardcoded in `apiClient.ts` e `authService.ts` — vedi [Problemi noti](#problemi-noti)).

---

## Architettura backend

```
backend/app/
├── main.py            # crea la FastAPI app, monta i router, CORS
├── db.py              # engine async + Base dichiarativa (usata anche da Alembic)
├── auth.py             # JWT encode/decode, dependency get_current_user / require_coach / require_client
├── models.py           # modelli SQLAlchemy (User, Program, ProgramDay, ProgramExercise, TargetSet, Session, SessionSet, ExerciseHistory, ...)
├── schemas.py           # schemi Pydantic v2, BaseSchema con alias camelCase automatico
├── enums.py             # StrEnum condivisi (ExerciseType, ExerciseCategory, DiffStatus)
├── diff.py              # logica pura di confronto tra due versioni di scheda
├── seed.py              # popola coach + cliente demo + esercizi + scheda
├── api/                 # router FastAPI (auth, clients, exercises, programs, sessions)
└── crud/                 # accesso al DB per ciascun dominio + diff_service (orchestratore diff/storico)
```

Il modello di dominio: un coach crea `Program` versionati (`version`, `parent_id`) per i propri clienti (`User.coach_id`); ogni `Program` ha `ProgramDay` → `ProgramExercise` → `TargetSet`. Il cliente esegue una scheda producendo `Session` → `SessionSet`, che a fine sessione vengono aggregati in `ExerciseHistory` (cache di lettura per lo storico pesi).

## Architettura frontend

```
frontend/src/
├── api/            # apiClient (wrapper fetch) + un service per dominio (auth, client, program, session)
├── context/        # AuthContext (utente/token), WorkoutContext (stato di un allenamento in corso)
├── components/     # layout (TopBar, TabBar) + componenti scheda (ExerciseCard, DiffBadge, CoachNoteBanner)
├── pages/
│   ├── client/     # SchedaPage, WorkoutPage, EserciziPage, StoricoPage (vuota)
│   └── coach/      # ClientiPage, EditorPage, SchemaEditor, NotePage (vuota)
└── types/          # tipi TS che rispecchiano gli schemi Pydantic
```

`apiClient.ts` centralizza header, token JWT e normalizzazione errori HTTP; ogni `*Service.ts` è un thin wrapper 1:1 sugli endpoint FastAPI.

---

## Note su Alembic

Le migrazioni vivono in `backend/alembic/versions`. Per generarne una nuova dopo aver modificato `app/models.py`:

```bash
cd backend
uv run alembic revision --autogenerate -m "descrizione modifica"
uv run alembic upgrade head
```