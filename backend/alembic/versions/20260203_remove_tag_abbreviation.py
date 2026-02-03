"""Remove abbreviation and next_sequence from tags table

Revision ID: 20260203_002
Revises: 20260203_001
Create Date: 2026-02-03

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect


# revision identifiers, used by Alembic.
revision = '20260203_002'
down_revision = '20260203_001'
branch_labels = None
depends_on = None


def column_exists(table_name: str, column_name: str) -> bool:
    """Check if a column exists in a table."""
    bind = op.get_bind()
    inspector = inspect(bind)
    columns = [col['name'] for col in inspector.get_columns(table_name)]
    return column_name in columns


def upgrade() -> None:
    # Remove abbreviation from tags table (if exists)
    if column_exists('tags', 'abbreviation'):
        op.drop_column('tags', 'abbreviation')

    # Remove next_sequence from tags table (if exists)
    if column_exists('tags', 'next_sequence'):
        op.drop_column('tags', 'next_sequence')


def downgrade() -> None:
    # Add back abbreviation to tags table (if not exists)
    if not column_exists('tags', 'abbreviation'):
        op.add_column('tags', sa.Column('abbreviation', sa.String(10), nullable=True))

    # Add back next_sequence to tags table (if not exists)
    if not column_exists('tags', 'next_sequence'):
        op.add_column('tags', sa.Column('next_sequence', sa.Integer(), nullable=False, server_default='1'))
