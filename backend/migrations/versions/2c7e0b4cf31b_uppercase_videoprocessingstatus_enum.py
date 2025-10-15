"""Uppercase videoprocessingstatus enum labels and update default

Revision ID: 2c7e0b4cf31b
Revises: 1bba4e33ca9e
Create Date: 2025-10-15 00:00:00

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '2c7e0b4cf31b'
down_revision: Union[str, Sequence[str], None] = '1bba4e33ca9e'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema: rename enum labels to uppercase and fix default."""
    # Rename enum values to uppercase if they exist in lowercase
    op.execute(
        """
        DO $$
        DECLARE
            has_pending BOOLEAN;
            has_completed BOOLEAN;
            has_failed BOOLEAN;
        BEGIN
            SELECT EXISTS (
                SELECT 1 FROM pg_type t
                JOIN pg_enum e ON t.oid = e.enumtypid
                WHERE t.typname = 'videoprocessingstatus' AND e.enumlabel = 'pending'
            ) INTO has_pending;
            IF has_pending THEN
                ALTER TYPE videoprocessingstatus RENAME VALUE 'pending' TO 'PENDING';
            END IF;

            SELECT EXISTS (
                SELECT 1 FROM pg_type t
                JOIN pg_enum e ON t.oid = e.enumtypid
                WHERE t.typname = 'videoprocessingstatus' AND e.enumlabel = 'completed'
            ) INTO has_completed;
            IF has_completed THEN
                ALTER TYPE videoprocessingstatus RENAME VALUE 'completed' TO 'COMPLETED';
            END IF;

            SELECT EXISTS (
                SELECT 1 FROM pg_type t
                JOIN pg_enum e ON t.oid = e.enumtypid
                WHERE t.typname = 'videoprocessingstatus' AND e.enumlabel = 'failed'
            ) INTO has_failed;
            IF has_failed THEN
                ALTER TYPE videoprocessingstatus RENAME VALUE 'failed' TO 'FAILED';
            END IF;
        END
        $$;
        """
    )

    # Ensure server default on videos.status is uppercase 'PENDING'
    op.execute("ALTER TABLE videos ALTER COLUMN status SET DEFAULT 'PENDING';")


def downgrade() -> None:
    """Downgrade schema: rename enum labels back to lowercase and reset default."""
    # Rename enum values back to lowercase if they exist in uppercase
    op.execute(
        """
        DO $$
        DECLARE
            has_pending BOOLEAN;
            has_completed BOOLEAN;
            has_failed BOOLEAN;
        BEGIN
            SELECT EXISTS (
                SELECT 1 FROM pg_type t
                JOIN pg_enum e ON t.oid = e.enumtypid
                WHERE t.typname = 'videoprocessingstatus' AND e.enumlabel = 'PENDING'
            ) INTO has_pending;
            IF has_pending THEN
                ALTER TYPE videoprocessingstatus RENAME VALUE 'PENDING' TO 'pending';
            END IF;

            SELECT EXISTS (
                SELECT 1 FROM pg_type t
                JOIN pg_enum e ON t.oid = e.enumtypid
                WHERE t.typname = 'videoprocessingstatus' AND e.enumlabel = 'COMPLETED'
            ) INTO has_completed;
            IF has_completed THEN
                ALTER TYPE videoprocessingstatus RENAME VALUE 'COMPLETED' TO 'completed';
            END IF;

            SELECT EXISTS (
                SELECT 1 FROM pg_type t
                JOIN pg_enum e ON t.oid = e.enumtypid
                WHERE t.typname = 'videoprocessingstatus' AND e.enumlabel = 'FAILED'
            ) INTO has_failed;
            IF has_failed THEN
                ALTER TYPE videoprocessingstatus RENAME VALUE 'FAILED' TO 'failed';
            END IF;
        END
        $$;
        """
    )

    # Reset server default to lowercase 'pending'
    op.execute("ALTER TABLE videos ALTER COLUMN status SET DEFAULT 'pending';")