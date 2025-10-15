"""Replace is_processed with status enum and add error_message field

Revision ID: 1bba4e33ca9e
Revises: b5f9a3e1c2d4
Create Date: 2025-10-15 06:15:21.681265

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '1bba4e33ca9e'
down_revision: Union[str, Sequence[str], None] = 'b5f9a3e1c2d4'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Create enum type with lowercase values to match SQLAlchemy model values
    video_status_enum = sa.Enum('pending', 'completed', 'failed', name='videoprocessingstatus')
    bind = op.get_bind()
    video_status_enum.create(bind, checkfirst=True)

    # Add new columns
    op.add_column('videos', sa.Column('status', video_status_enum, server_default='pending', nullable=False))
    op.add_column('videos', sa.Column('error_message', sa.Text(), nullable=True))

    # Migrate existing data from is_processed to status
    op.execute("UPDATE videos SET status = 'completed' WHERE is_processed = TRUE")

    # Drop old column
    op.drop_column('videos', 'is_processed')


def downgrade() -> None:
    """Downgrade schema."""
    # Recreate old column
    op.add_column('videos', sa.Column('is_processed', sa.BOOLEAN(), server_default=sa.text('false'), autoincrement=False, nullable=False))

    # Migrate status back to is_processed
    op.execute("UPDATE videos SET is_processed = TRUE WHERE status = 'completed'")

    # Drop new columns
    op.drop_column('videos', 'error_message')
    op.drop_column('videos', 'status')

    # Drop enum type
    bind = op.get_bind()
    sa.Enum(name='videoprocessingstatus').drop(bind, checkfirst=True)
