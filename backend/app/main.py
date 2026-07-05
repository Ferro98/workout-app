from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Importa i router dalla tua cartella api
from app.api import clients, exercises, programs, sessions, auth

app = FastAPI(title="Workout App API")

origins = [
    "http://localhost:5173",   
    "http://127.0.0.1:5173", 
]

# Configura i CORS per far comunicare il frontend (es. React/Vue) col backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins, # In produzione metti l'URL del frontend, es: ["http://localhost:5173"]
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Collega tutte le rotte!
# Tutte avranno il prefisso /api (es. /api/clients, /api/exercises)
app.include_router(auth.router, prefix="/auth", tags=["auth"])
app.include_router(clients.router, prefix="/api")
# app.include_router(exercises.router, prefix="/api")
app.include_router(programs.router, prefix="/api")
app.include_router(sessions.router, prefix="/api")

@app.get("/")
async def root():
    return {"message": "API Backend is running! Vai su /docs per Swagger."}


@app.get("/health")
async def health():
    return {"status": "ok"}
