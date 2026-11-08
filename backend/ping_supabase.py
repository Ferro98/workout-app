import asyncio
import os

from dotenv import load_dotenv
from sqlalchemy import text
from sqlalchemy.ext.asyncio import create_async_engine

# Carica le variabili d'ambiente (assicurati che punti al DB di Supabase)
load_dotenv()
DATABASE_URL = os.getenv("DATABASE_URL")

async def ping_database():
    print("Connessione a Supabase in corso...")
    
    # Creiamo un engine rapido usa-e-getta
    engine = create_async_engine(DATABASE_URL, echo=False)
    
    try:
        async with engine.connect() as conn:
            # La query più leggera possibile
            await conn.execute(text("SELECT 1"))
            print("✅ Ping completato con successo! Supabase non andrà in pausa.")
    except Exception as e:
        print(f"❌ Errore durante il ping: {e}")
    finally:
        await engine.dispose()

if __name__ == "__main__":
    asyncio.run(ping_database())