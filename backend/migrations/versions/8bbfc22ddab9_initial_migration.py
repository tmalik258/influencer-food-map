"""Initial migration

Revision ID: 8bbfc22ddab9
Revises: 
Create Date: 2025-07-27 22:50:09.500462

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '8bbfc22ddab9'
down_revision: Union[str, Sequence[str], None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # ### commands auto generated by Alembic - please adjust! ###
    op.create_table('influencers',
    sa.Column('id', sa.UUID(), nullable=False),
    sa.Column('name', sa.String(length=255), nullable=False),
    sa.Column('bio', sa.Text(), nullable=True),
    sa.Column('avatar_url', sa.String(length=255), nullable=True),
    sa.Column('region', sa.String(length=100), nullable=True),
    sa.Column('youtube_channel_id', sa.String(length=100), nullable=False),
    sa.Column('youtube_channel_url', sa.String(length=255), nullable=True),
    sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
    sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
    sa.PrimaryKeyConstraint('id'),
    sa.UniqueConstraint('youtube_channel_id')
    )
    op.create_table('restaurants',
    sa.Column('id', sa.UUID(), nullable=False),
    sa.Column('name', sa.String(length=255), nullable=False),
    sa.Column('branch_name', sa.String(length=255), nullable=True),
    sa.Column('address', sa.Text(), nullable=False),
    sa.Column('latitude', sa.Float(), nullable=False),
    sa.Column('longitude', sa.Float(), nullable=False),
    sa.Column('city', sa.String(length=100), nullable=True),
    sa.Column('country', sa.String(length=100), nullable=True),
    sa.Column('google_place_id', sa.String(length=255), nullable=True),
    sa.Column('google_rating', sa.Float(), nullable=True),
    sa.Column('live_status', sa.Boolean(), nullable=True),
    sa.Column('is_active', sa.Boolean(), nullable=True),
    sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
    sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
    sa.PrimaryKeyConstraint('id'),
    sa.UniqueConstraint('google_place_id')
    )
    op.create_index(op.f('ix_restaurants_city'), 'restaurants', ['city'], unique=False)
    op.create_index(op.f('ix_restaurants_country'), 'restaurants', ['country'], unique=False)
    op.create_table('tags',
    sa.Column('id', sa.UUID(), nullable=False),
    sa.Column('name', sa.String(length=100), nullable=False),
    sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
    sa.PrimaryKeyConstraint('id'),
    sa.UniqueConstraint('name')
    )
    op.create_table('restaurant_tags',
    sa.Column('restaurant_id', sa.UUID(), nullable=False),
    sa.Column('tag_id', sa.UUID(), nullable=False),
    sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
    sa.ForeignKeyConstraint(['restaurant_id'], ['restaurants.id'], ondelete='CASCADE'),
    sa.ForeignKeyConstraint(['tag_id'], ['tags.id'], ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('restaurant_id', 'tag_id')
    )
    op.create_table('videos',
    sa.Column('id', sa.UUID(), nullable=False),
    sa.Column('influencer_id', sa.UUID(), nullable=True),
    sa.Column('youtube_video_id', sa.String(length=100), nullable=False),
    sa.Column('title', sa.String(length=255), nullable=False),
    sa.Column('description', sa.Text(), nullable=True),
    sa.Column('video_url', sa.String(length=255), nullable=False),
    sa.Column('published_at', sa.DateTime(timezone=True), nullable=True),
    sa.Column('transcription', sa.Text(), nullable=True),
    sa.Column('summary', sa.Text(), nullable=True),
    sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
    sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
    sa.ForeignKeyConstraint(['influencer_id'], ['influencers.id'], ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('id'),
    sa.UniqueConstraint('youtube_video_id')
    )
    op.create_table('listings',
    sa.Column('id', sa.UUID(), nullable=False),
    sa.Column('restaurant_id', sa.UUID(), nullable=True),
    sa.Column('video_id', sa.UUID(), nullable=True),
    sa.Column('influencer_id', sa.UUID(), nullable=True),
    sa.Column('visit_date', sa.Date(), nullable=True),
    sa.Column('quotes', postgresql.ARRAY(sa.Text()), nullable=True),
    sa.Column('confidence_score', sa.Float(), nullable=True),
    sa.Column('approved', sa.Boolean(), nullable=True),
    sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
    sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
    sa.ForeignKeyConstraint(['influencer_id'], ['influencers.id'], ondelete='CASCADE'),
    sa.ForeignKeyConstraint(['restaurant_id'], ['restaurants.id'], ondelete='CASCADE'),
    sa.ForeignKeyConstraint(['video_id'], ['videos.id'], ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_listings_influencer_id'), 'listings', ['influencer_id'], unique=False)
    # ### end Alembic commands ###


def downgrade() -> None:
    """Downgrade schema."""
    # ### commands auto generated by Alembic - please adjust! ###
    op.drop_index(op.f('ix_listings_influencer_id'), table_name='listings')
    op.drop_table('listings')
    op.drop_table('videos')
    op.drop_table('restaurant_tags')
    op.drop_table('tags')
    op.drop_index(op.f('ix_restaurants_country'), table_name='restaurants')
    op.drop_index(op.f('ix_restaurants_city'), table_name='restaurants')
    op.drop_table('restaurants')
    op.drop_table('influencers')
    # ### end Alembic commands ###
