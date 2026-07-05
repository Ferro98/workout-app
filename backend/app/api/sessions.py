from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.db import get_db
from app.auth import get_current_user
from app.models import User
from app import schemas
from app.crud import sessions as crud_sessions

router = APIRouter(prefix="/clients", tags=["Sessions"])

@router.post("/{client_id}/sessions", response_model=schemas.WorkoutSessionOut, status_code=status.HTTP_201_CREATED)
async def log_workout_session(
    client_id: int,
    session_in: schemas.SessionCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Controllo di sicurezza: solo il cliente stesso o il suo coach possono salvare/vedere
    if current_user.role == "client" and current_user.id != client_id:
        raise HTTPException(status_code=403, detail="Non puoi salvare sessioni per un altro utente")
        
    if current_user.role == "coach":
        result = await db.execute(select(User).where(User.id == client_id))
        client = result.scalar_one_or_none()
        if not client or client.role != "client" or client.coach_id != current_user.id:
            raise HTTPException(status_code=403, detail="Questo cliente non appartiene a te")

    session_out = await crud_sessions.create_workout_session(db=db, client_id=client_id, session_in=session_in)
    return session_out