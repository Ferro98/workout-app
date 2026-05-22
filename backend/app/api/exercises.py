from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List

from ..db import get_db
from ..auth import require_coach, require_client
from .. import schemas, crud

# Inizializziamo il router. 
# Visto che in main.py hai messo prefix="/api", con questo avremo la rotta "/api/exercises"
router = APIRouter(prefix="/exercises", tags=["Exercises"])

@router.get("/")
async def dummy_endpoint():
    return {"message": "Rotta esercizi funzionante!"}