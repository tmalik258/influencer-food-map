"""add_lock_type field

Revision ID: 463acaa947e0
Revises: a25d437145a5
Create Date: 2025-09-26 13:04:38.194007

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '463acaa947e0'
down_revision: Union[str, Sequence[str], None] = 'a25d437145a5'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Create the enum type first
    trigger_type_enum = sa.Enum('AUTOMATIC', 'MANUAL', 'SYSTEM', name='locktype')
    trigger_type_enum.create(op.get_bind())
    
    # Add the column with a default value for existing rows
    op.add_column('jobs', sa.Column('trigger_type', trigger_type_enum, nullable=False, server_default='AUTOMATIC'))


def downgrade() -> None:
    """Downgrade schema."""
    # Drop the column first
    op.drop_column('jobs', 'trigger_type')
    
    # Then drop the enum type
    trigger_type_enum = sa.Enum('AUTOMATIC', 'MANUAL', 'SYSTEM', name='locktype')
    trigger_type_enum.drop(op.get_bind())