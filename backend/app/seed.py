import asyncio
from datetime import datetime, timezone
from app.db import AsyncSessionLocal
from app.models import User
from app.auth import hash_password

async def seed_data():
    print("Inizio popolamento database...")
    
    # Apriamo la sessione asincrona
    async with AsyncSessionLocal() as db:
        
        # Generiamo l'hash vero e proprio per la password "password123"
        hashed_pwd = hash_password("password123")
        
        # 1. Creiamo il Coach
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
        await db.flush() # Otteniamo l'ID senza committare definitivamente
        print(f"Coach creato con ID: {coach.id}")

        # 2. Creiamo il Cliente collegato
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
        await db.commit() # Ora salviamo tutto assieme
        
        print("✅ Database popolato con successo!")
        print("📧 Email Coach: coach@test.com | 🔑 Pass: password123")
        print("📧 Email Cliente: cliente@test.com | 🔑 Pass: password123")

if __name__ == "__main__":
    asyncio.run(seed_data())