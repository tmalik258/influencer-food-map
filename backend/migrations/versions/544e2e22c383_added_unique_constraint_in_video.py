"""added unique constraint in video

Revision ID: 544e2e22c383
Revises: 8caa69822dc9
Create Date: 2025-08-03 00:48:53.469893

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '544e2e22c383'
down_revision: Union[str, Sequence[str], None] = '8caa69822dc9'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Delete duplicate video rows that are not associated with any listings, keeping the most recent one based on created_at
    op.execute("""
        DELETE FROM videos
        WHERE id IN (
            SELECT id
            FROM (
                SELECT v.id,
                       ROW_NUMBER() OVER (
                           PARTITION BY v.influencer_id, v.youtube_video_id
                           ORDER BY v.created_at DESC
                       ) as rn
                FROM videos v
                LEFT JOIN listings l ON v.id = l.video_id
                WHERE l.video_id IS NULL
            ) t
            WHERE rn > 1
        )
    """)
    
    # Make influencer_id non-nullable
    op.alter_column('videos', 'influencer_id',
                    existing_type=sa.UUID(),
                    nullable=False)
    
    # Create the unique constraint
    op.create_unique_constraint('uix_influencer_youtube_video_id', 'videos', ['influencer_id', 'youtube_video_id'])


def downgrade() -> None:
    """Downgrade schema."""
    # Drop the unique constraint
    op.drop_constraint('uix_influencer_youtube_video_id', 'videos', type_='unique')
    
    # Revert influencer_id to nullable
    op.alter_column('videos', 'influencer_id',
                    existing_type=sa.UUID(),
                    nullable=True)