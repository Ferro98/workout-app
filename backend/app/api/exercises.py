from typing import List

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from .. import schemas
from ..auth import get_current_user
from ..crud import exercises as crud_exercises
from ..db import get_db

router = APIRouter(prefix="/exercises", tags=["Exercises"])

@router.get("/", response_model=List[schemas.ExerciseBase], dependencies=[Depends(get_current_user)])
async def list_exercises(db: AsyncSession = Depends(get_db)):
    """Return the exercise catalog, ordered by category and name. Any authenticated user can read it."""
    return await crud_exercises.get_exercises(db)
