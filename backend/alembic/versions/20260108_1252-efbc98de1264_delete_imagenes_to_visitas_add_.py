"""delete imagenes to visitas, add observacion_entrada, observacion_salida to visitas and tipo to visita_imagen

Revision ID: efbc98de1264
Revises: 5640ab901839
Create Date: 2026-01-08 12:52:40.069005-06:00

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'efbc98de1264'
down_revision: Union[str, None] = '5640ab901839'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
