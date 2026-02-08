"""add_push_subscriptions_and_update_notificaciones

Revision ID: 5b8a8a93abb9
Revises: ff715fef0075
Create Date: 2026-02-07 11:30:15.399909-06:00

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '5b8a8a93abb9'
down_revision: Union[str, None] = 'ff715fef0075'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # 1. Crear tabla push_subscriptions
    op.create_table(
        'push_subscriptions',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('usuario_id', sa.Integer(), nullable=False),
        sa.Column('endpoint', sa.Text(), nullable=False),
        sa.Column('p256dh_key', sa.Text(), nullable=False),
        sa.Column('auth_key', sa.Text(), nullable=False),
        sa.Column('user_agent', sa.String(length=500), nullable=True),
        sa.Column('fecha_creacion', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['usuario_id'], ['usuarios.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('endpoint')
    )
    op.create_index(op.f('ix_push_subscriptions_id'), 'push_subscriptions', ['id'], unique=False)
    op.create_index(op.f('ix_push_subscriptions_usuario_id'), 'push_subscriptions', ['usuario_id'], unique=False)
    
    # 2. Actualizar tabla notificaciones
    # Agregar columna usuario_id
    op.add_column('notificaciones', sa.Column('usuario_id', sa.Integer(), nullable=True))
    op.create_index(op.f('ix_notificaciones_usuario_id'), 'notificaciones', ['usuario_id'], unique=False)
    op.create_foreign_key('fk_notificaciones_usuario_id', 'notificaciones', 'usuarios', ['usuario_id'], ['id'], ondelete='CASCADE')
    
    # Agregar columna tipo_notificacion
    op.add_column('notificaciones', sa.Column('tipo_notificacion', sa.String(length=50), nullable=True))
    
    # Hacer visita_id nullable
    op.alter_column('notificaciones', 'visita_id', existing_type=sa.Integer(), nullable=True)
    
    # Agregar constraint para tipo_notificacion
    op.create_check_constraint(
        'check_tipo_notificacion',
        'notificaciones',
        "tipo_notificacion IN ('visita', 'ticket', 'social', 'sistema')"
    )


def downgrade() -> None:
    """Downgrade schema."""
    # Revertir cambios en notificaciones
    op.drop_constraint('check_tipo_notificacion', 'notificaciones', type_='check')
    op.alter_column('notificaciones', 'visita_id', existing_type=sa.Integer(), nullable=False)
    op.drop_column('notificaciones', 'tipo_notificacion')
    op.drop_constraint('fk_notificaciones_usuario_id', 'notificaciones', type_='foreignkey')
    op.drop_index(op.f('ix_notificaciones_usuario_id'), table_name='notificaciones')
    op.drop_column('notificaciones', 'usuario_id')
    
    # Eliminar tabla push_subscriptions
    op.drop_index(op.f('ix_push_subscriptions_usuario_id'), table_name='push_subscriptions')
    op.drop_index(op.f('ix_push_subscriptions_id'), table_name='push_subscriptions')
    op.drop_table('push_subscriptions')
