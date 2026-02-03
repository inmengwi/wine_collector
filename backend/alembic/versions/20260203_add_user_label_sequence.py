"""Add next_label_sequence to users table

Revision ID: 20260203_001
Revises: 20260202_001
Create Date: 2026-02-03

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect


# revision identifiers, used by Alembic.
revision = '20260203_001'
down_revision = '20260202_001'
branch_labels = None
depends_on = None


def column_exists(table_name: str, column_name: str) -> bool:
    """Check if a column exists in a table."""
    bind = op.get_bind()
    inspector = inspect(bind)
    columns = [col['name'] for col in inspector.get_columns(table_name)]
    return column_name in columns


def upgrade() -> None:
    # Add next_label_sequence to users table (if not exists)
    if not column_exists('users', 'next_label_sequence'):
        op.add_column('users', sa.Column('next_label_sequence', sa.Integer(), nullable=False, server_default='1'))


def downgrade() -> None:
    # Remove next_label_sequence from users
    if column_exists('users', 'next_label_sequence'):
        op.drop_column('users', 'next_label_sequence')
