# GymCoach

Mobile-first app for managing workout programs between a **coach** and a **client**.
The coach creates and versions programs, the client executes them at the gym logging completed sets, and sees a history of weights/performance over time.

Monorepo with two independent projects:

```
.
├── backend/    FastAPI + PostgreSQL (async)
└── frontend/   React + TypeScript + Vite (PWA)
```

> This README describes the **actual state** of the code in this repository, not a plan. The [Known Issues](#known-issues) and [Next Steps](#next-steps) sections are the most up-to-date source of truth on what works and what's missing.

---

## Tech Stack

| Layer        | Technology                            | Notes                                                  |
| ------------ | -------------------------------------- | ------------------------------------------------------ |
| Frontend     | React 19 + TypeScript + Vite          | PWA (`vite-plugin-pwa`), installable on mobile          |
| Styling      | Tailwind CSS v4                       | Dark mode via `prefers-color-scheme`                    |
| Routing      | React Router v6                       | Separate routes per role (`client` / `coach`)            |
| Icons        | `@tabler/icons-react`, `lucide-react` | —                                                        |
| Backend      | FastAPI (async)                       | REST + JWT auth                                          |
| ORM          | SQLAlchemy 2.0 async                  | `AsyncSession`, `Mapped[...]`, `selectinload`            |
| Migrations   | Alembic                               | Versioned migrations in `backend/alembic/versions`       |
| Database     | PostgreSQL (Supabase in dev)          | `backend/ping_supabase.py` to prevent auto-pause         |
| Auth         | `python-jose` + `bcrypt`              | JWT with `sub`/`role`/`exp`, OAuth2 password flow         |
| Package mgmt | `uv` (backend) · `npm` (frontend)     | See `backend/uv.lock` / `frontend/package-lock.json`      |

---

## Project Status

Legend: ✅ working and connected end-to-end · 🟡 partially implemented / with known bugs · ⬜ not implemented yet

| Feature                                       | Backend | Frontend | Notes                                                                                                                                                                                                                              |
| ---------------------------------------------- | :-----: | :------: | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Registration / Login (JWT)                    |    ✅    |    🟡     | Backend works. The frontend **auto-logs in with hardcoded credentials** (`coach@test.com`) instead of a real login page — see [Known Issues](#known-issues).                                                                    |
| User profile (`/auth/me`)                     |    ✅    |    🟡     | The backend already returns camelCase (`fullName`), but the `UserMe` TS type still declares `name` → the username shows up as `undefined` at runtime.                                                                            |
| Client list (coach)                           |    ✅    |    ✅     | `ClientiPage` wired to `GET /api/clients/`.                                                                                                                                                                                        |
| Active program (client)                       |    ✅    |    ✅     | `SchedaPage` wired to `GET /api/programs/active`.                                                                                                                                                                                  |
| Program editor / new version (coach)          |    ✅    |    ✅     | `EditorPage` + `SchemaEditor`, sends the full day → exercise → set tree.                                                                                                                                                          |
| Diff between program versions                 |    ✅    |    ✅     | `diff.py` computes the comparison, `diff_service.py` injects it into `GET /api/programs/active`; `DiffBadge`/`ExerciseCard` already display it.                                                                                  |
| Weight history per exercise                   |    ✅    |    ✅     | Populated by `crud/sessions.py` into `ExerciseHistory`, exposed via `diff_service`.                                                                                                                                                |
| Workout execution (timer, sets, rest)         |    —    |    ✅     | `WorkoutPage` + `WorkoutContext`, UI complete and working locally.                                                                                                                                                                 |
| **Saving a workout session**                  |    ✅    |    🟡     | The `POST /api/clients/{id}/sessions` endpoint and `sessionService.createSession` are correct and aligned, **but no page calls them yet**: `WorkoutPage.finish()` doesn't send the session to the backend. This is the most important gap to close. |
| Workout history page (client)                 |    —    |    ⬜     | `StoricoPage.tsx` is empty, the route shows a placeholder.                                                                                                                                                                         |
| Coach notes page                              |    —    |    ⬜     | `NotePage.tsx` is empty, the route shows a placeholder.                                                                                                                                                                            |
| Exercise CRUD (catalog)                       |    ⬜    |    🟡     | The `exercises.py` router exists but is **disabled** in `main.py` and only exposes a dummy endpoint. `EserciziPage` works but reads from a mock array (`data/mock.ts`), not from the DB.                                          |
| Coach → client ownership                      |    ✅    |    ✅     | Verified on all main endpoints (see fixes listed below).                                                                                                                                                                           |

---

## Setup

### Backend

Requires Python ≥ 3.11 and [uv](https://docs.astral.sh/uv/).

```bash
cd backend
cp .env.example .env      # then fill in the values, see table below
uv sync
uv run alembic upgrade head
uv run python -m app.seed   # creates coach@test.com / password123 + demo data
uv run fastapi dev app/main.py
```

The API is available at `http://localhost:8000`, Swagger at `http://localhost:8000/docs`.

#### Environment variables (`backend/.env`)

| Variable                      | Required | Description                                                                                                                          |
| ------------------------------ | :------: | -------------------------------------------------------------------------------------------------------------------------------------- |
| `DATABASE_URL`                 |    ✅    | Async connection string, e.g. `postgresql+asyncpg://user:pass@host:5432/dbname`                                                       |
| `DATABASE_PASS`                |    —    | Database password, kept separate for convenience/rotation; **not yet read by the code**, which expects the password already inside `DATABASE_URL` |
| `SECRET_KEY`                   |    ✅    | Key used to sign JWTs (`app/auth.py`, fails at startup if missing)                                                                     |
| `ALGORITHM`                    |    ✅    | JWT algorithm, e.g. `HS256`                                                                                                            |
| `ACCESS_TOKEN_EXPIRE_MINUTES`  |    ✅    | Token lifetime in minutes                                                                                                              |
| `TEST_DATABASE_URL`            |    —    | Reserved for a future test suite against a separate DB; **not yet used** by the code                                                    |

See `backend/.env.example`.

### Frontend

Requires Node ≥ 18.

```bash
cd frontend
npm install
npm run dev
```

The app runs on `http://localhost:5173` and expects the backend on `http://localhost:8000` (hardcoded in `apiClient.ts` and `authService.ts` — see [Known Issues](#known-issues)).

---

## Backend Architecture

```
backend/app/
├── main.py            # creates the FastAPI app, mounts routers, CORS
├── db.py              # async engine + declarative Base (also used by Alembic)
├── auth.py             # JWT encode/decode, get_current_user / require_coach / require_client dependencies
├── models.py           # SQLAlchemy models (User, Program, ProgramDay, ProgramExercise, TargetSet, Session, SessionSet, ExerciseHistory, ...)
├── schemas.py           # Pydantic v2 schemas, BaseSchema with automatic camelCase alias
├── enums.py             # shared StrEnums (ExerciseType, ExerciseCategory, DiffStatus)
├── diff.py              # pure logic for comparing two program versions
├── seed.py              # seeds a demo coach + client + exercises + program
├── api/                 # FastAPI routers (auth, clients, exercises, programs, sessions)
└── crud/                 # DB access per domain + diff_service (diff/history orchestrator)
```

Domain model: a coach creates versioned `Program`s (`version`, `parent_id`) for their clients (`User.coach_id`); each `Program` has `ProgramDay` → `ProgramExercise` → `TargetSet`. The client executes a program, producing `Session` → `SessionSet`, which get aggregated at the end of the session into `ExerciseHistory` (a read cache for weight history).

## Frontend Architecture

```
frontend/src/
├── api/            # apiClient (fetch wrapper) + one service per domain (auth, client, program, session)
├── context/        # AuthContext (user/token), WorkoutContext (state of an in-progress workout)
├── components/     # layout (TopBar, TabBar) + program components (ExerciseCard, DiffBadge, CoachNoteBanner)
├── pages/
│   ├── client/     # SchedaPage, WorkoutPage, EserciziPage, StoricoPage (empty)
│   └── coach/      # ClientiPage, EditorPage, SchemaEditor, NotePage (empty)
└── types/          # TS types mirroring the Pydantic schemas
```

`apiClient.ts` centralizes headers, the JWT token, and HTTP error normalization; each `*Service.ts` is a thin 1:1 wrapper over the FastAPI endpoints.

---

## Alembic Notes

Migrations live in `backend/alembic/versions`. To generate a new one after changing `app/models.py`:

```bash
cd backend
uv run alembic revision --autogenerate -m "change description"
uv run alembic upgrade head
```

---

## Known Issues

- **Workout sessions aren't persisted.** `WorkoutPage.finish()` never calls `sessionService.createSession`, even though the backend endpoint and the service function are both implemented and aligned. This is the single most important gap.
- **No real login page.** The frontend auto-logs in with hardcoded demo credentials (`coach@test.com` / `password123`) instead of a login form — there's a working `/auth/login` endpoint on the backend, just no UI for it yet.
- **`UserMe.name` vs. `fullName` mismatch.** The backend already serializes the user's name as `fullName` (camelCase), but the frontend's `UserMe` type still declares `name`, so the display name resolves to `undefined` at runtime.
- **Exercise catalog isn't wired up.** The `exercises.py` router exists but is commented out in `main.py`; `EserciziPage` renders from a static mock array (`data/mock.ts`) instead of the database.
- **Hardcoded API base URL.** `http://localhost:8000` is hardcoded in `apiClient.ts` and `authService.ts` instead of coming from an environment variable, so there's no easy way to point the frontend at a deployed backend yet.
- **`DATABASE_PASS` is unused.** The env var is documented and read into the environment but never referenced by the code, which expects the password to already be embedded in `DATABASE_URL`.

## Next Steps

1. Wire `WorkoutPage.finish()` to `sessionService.createSession` so completed sessions actually persist.
2. Build a real login page and remove the hardcoded auto-login.
3. Fix the `UserMe` type to match the backend's camelCase `fullName`.
4. Re-enable the `exercises.py` router and point `EserciziPage` at the real API instead of the mock data.
5. Move the frontend's API base URL into an environment variable (`VITE_API_URL` or similar).
6. Build out `StoricoPage` (workout history) and `NotePage` (coach notes) — both currently placeholders.
7. Add a test suite against `TEST_DATABASE_URL`, which is already provisioned for but unused.
