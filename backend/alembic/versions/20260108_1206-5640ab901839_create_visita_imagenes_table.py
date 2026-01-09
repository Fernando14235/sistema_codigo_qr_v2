"""create visita_imagenes table

Revision ID: 5640ab901839
Revises: 7e236e30e3f0
Create Date: 2026-01-08 12:06:42.793314-06:00

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '5640ab901839'
down_revision: Union[str, None] = '7e236e30e3f0'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema.""" 
    op.create_table( 
        'visita_imagenes', 
        sa.Column('id', sa.Integer(), primary_key=True, index=True), 
        sa.Column('visita_id', sa.Integer(), sa.ForeignKey('visitas.id', ondelete='CASCADE'), nullable=False), 
        sa.Column('url', sa.String(), nullable=False), 
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_table('visita_imagenes')
    
