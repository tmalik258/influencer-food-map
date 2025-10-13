"""add_refresh_youtube_cookies_to_jobtype

Revision ID: b5f9a3e1c2d4
Revises: 3b1a2f9e0abc
Create Date: 2025-10-12 00:00:00

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = 'b5f9a3e1c2d4'
down_revision: Union[str, Sequence[str], None] = '3b1a2f9e0abc'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema: add new enum value to jobtype."""
    # Safely add enum value if it doesn't exist
    op.execute(
        """
        DO $$
        BEGIN
            IF NOT EXISTS (
                SELECT 1
                FROM pg_type t
                JOIN pg_enum e ON t.oid = e.enumtypid
                WHERE t.typname = 'jobtype'
                  AND e.enumlabel = 'REFRESH_YOUTUBE_COOKIES'
            ) THEN
                ALTER TYPE jobtype ADD VALUE 'REFRESH_YOUTUBE_COOKIES';
            END IF;
        END
        $$;
        """
    )


def downgrade() -> None:
    """Downgrade schema: removing enum values from Postgres types is non-trivial.
    No-op downgrade for enum alteration."""
    pass