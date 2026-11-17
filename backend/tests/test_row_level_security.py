from sqlalchemy import text

from app.db import Base, engine


async def test_every_table_has_row_level_security():
    # Supabase exposes public tables through its Data API: without RLS they are open to anyone.
    # A new table must come with its own migration enabling RLS, or this test fails.
    expected = {t.name for t in Base.metadata.sorted_tables} | {"alembic_version"}

    async with engine.connect() as conn:
        result = await conn.execute(
            text(
                "SELECT c.relname FROM pg_class c "
                "JOIN pg_namespace n ON n.oid = c.relnamespace "
                "WHERE n.nspname = 'public' AND c.relkind = 'r' AND c.relrowsecurity"
            )
        )
        with_rls = {row[0] for row in result}

    assert expected <= with_rls, f"tables without RLS: {sorted(expected - with_rls)}"
