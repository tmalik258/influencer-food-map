"""add_error_messages_json_to_jobs

Revision ID: 3b1a2f9e0abc
Revises: 17e2dd4a3c68
Create Date: 2025-10-06 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '3b1a2f9e0abc'
down_revision: Union[str, Sequence[str], None] = '17e2dd4a3c68'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Add new JSONB column for error messages
    op.add_column('jobs', sa.Column('error_messages', postgresql.JSONB(astext_type=sa.Text()), nullable=True))

    # Migrate existing error_message text into JSON array
    op.execute(
        """
        UPDATE jobs
        SET error_messages = CASE
            WHEN error_message IS NOT NULL AND error_message <> '' THEN jsonb_build_array(error_message)
            ELSE '[]'::jsonb
        END
        """
    )

    # Drop old error_message column
    op.drop_column('jobs', 'error_message')



def downgrade() -> None:
    """Downgrade schema."""
    # Re-add old error_message column
    op.add_column('jobs', sa.Column('error_message', sa.Text(), nullable=True))

    # Migrate first element of error_messages back to error_message
    op.execute(
        """
        UPDATE jobs
        SET error_message = CASE
            WHEN error_messages IS NOT NULL AND jsonb_array_length(error_messages) > 0
                THEN error_messages->>0
            ELSE NULL
        END
        """
    )

    # Drop JSONB error_messages column
    op.drop_column('jobs', 'error_messages')