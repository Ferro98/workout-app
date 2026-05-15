from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI
from app.api import auth

app = FastAPI(title="GymCoach API")

app.include_router(auth.router, prefix="/auth", tags=["auth"])

@app.get("/health")
async def health():
    return {"status": "ok"}
