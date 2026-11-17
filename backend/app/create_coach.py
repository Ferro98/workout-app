import asyncio
import sys
from getpass import getpass

from sqlalchemy import select

from app.auth import hash_password
from app.db import AsyncSessionLocal
from app.models import User


async def create_coach(db, email, full_name, password) -> User | None:
    result_coach = await db.execute(select(User).where(User.email == email))
    coach = result_coach.scalar_one_or_none()

    if not coach:
        coach = User(
            email=email,
            password_hash=hash_password(password),
            full_name=full_name,
            role="coach",
            is_active=True,
            color_bg="#1e293b",
            color_text="#ffffff"
        )
        db.add(coach)
        await db.commit()
        return coach
    else:
        return None

async def main():
    email = input("Insert coach email: ").strip()
    name = input("Insert coach name: ").strip()
    if not email or not name:
        print("Email and name cannot be empty")
        sys.exit(1)

    password = ""
    while len(password) < 12:
        password = getpass("Insert password (>= 12 chars): ")
        if len(password) < 12:
            print("Password too short, try again")
    repeat_password = getpass("Repeat password: ")

    if password != repeat_password:
        print("Passwords are different!")
        sys.exit(1)
    
    async with AsyncSessionLocal() as db:
        result_coach = await create_coach(db, email, name, password)

        if not result_coach:
            print(f"Coach already exists")
            sys.exit(1)

        print(f"Coach created with ID: {result_coach.id}")


if __name__ == "__main__":
    asyncio.run(main())