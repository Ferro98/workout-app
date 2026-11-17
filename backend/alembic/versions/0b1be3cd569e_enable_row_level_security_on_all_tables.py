"""enable row level security on all tables

Revision ID: 0b1be3cd569e
Revises: 573df01a05e0
Create Date: 2026-11-17 11:04:06.353054

"""
from typing import Sequence, Union

from alembic import op

# revision identifiers, used by Alembic.
revision: str = '0b1be3cd569e'
down_revision: Union[str, Sequence[str], None] = '573df01a05e0'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

# Supabase exposes every table of the public schema through its Data API.
# With RLS enabled and no policies, the anon/authenticated roles get no access at all.
# The backend connects as the table owner, which is not subject to RLS, so it is unaffected.
TABLES = [
    "users",
    "exercises",
    "programs",
    "program_days",
    "program_exercises",
    "sessions",
    "exercise_history",
    "program_diffs",
    "session_sets",
    "target_sets",
    "alembic_version",
]


def upgrade() -> None:
    for table in TABLES:
        op.execute(f'ALTER TABLE "{table}" ENABLE ROW LEVEL SECURITY')


def downgrade() -> None:
    for table in TABLES:
        op.execute(f'ALTER TABLE "{table}" DISABLE ROW LEVEL SECURITY')
