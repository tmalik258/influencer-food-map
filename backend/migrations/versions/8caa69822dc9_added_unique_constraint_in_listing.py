"""added unique constraint in listing

Revision ID: 8caa69822dc9
Revises: 6b7c6afd98e4
Create Date: 2025-08-03 00:42:58.185391

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '8caa69822dc9'
down_revision: Union[str, Sequence[str], None] = '6b7c6afd98e4'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Delete duplicate rows, keeping the most recent one based on created_at
    op.execute("""
        DELETE FROM listings
        WHERE id IN (
            SELECT id
            FROM (
                SELECT id,
                       ROW_NUMBER() OVER (
                           PARTITION BY video_id, restaurant_id, influencer_id
                           ORDER BY created_at DESC
                       ) as rn
                FROM listings
            ) t
            WHERE rn > 1
        )
    """)
    
    # Create the unique constraint
    op.create_unique_constraint('uix_video_restaurant_influencer', 'listings', ['video_id', 'restaurant_id', 'influencer_id'])
    
    # Drop the summary column from videos
    op.drop_column('videos', 'summary')


def downgrade() -> None:
    """Downgrade schema."""
    # Re-add the summary column to videos
    op.add_column('videos', sa.Column('summary', sa.TEXT(), autoincrement=False, nullable=True))
    
    # Drop the unique constraint
    op.drop_constraint('uix_video_restaurant_influencer', 'listings', type_='unique')