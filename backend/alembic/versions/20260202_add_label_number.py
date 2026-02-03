"""Add label number fields and user sequence

Revision ID: 20260202_001
Revises:
Create Date: 2026-02-02

This migration adds:
- label_number to user_wines table
- next_label_sequence and label_sequence_year to users table

Note: abbreviation and next_sequence on tags table are no longer used
and will be removed if they exist.
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect


# revision identifiers, used by Alembic.
revision = '20260202_001'
down_revision = None
branch_labels = None
depends_on = None


def column_exists(table_name: str, column_name: str) -> bool:
    """Check if a column exists in a table."""
    bind = op.get_bind()
    inspector = inspect(bind)
    try:
        columns = [col['name'] for col in inspector.get_columns(table_name)]
        return column_name in columns
    except Exception:
        return False


def index_exists(table_name: str, index_name: str) -> bool:
    """Check if an index exists on a table."""
    bind = op.get_bind()
    inspector = inspect(bind)
    try:
        indexes = [idx['name'] for idx in inspector.get_indexes(table_name)]
        return index_name in indexes
    except Exception:
        return False


def upgrade() -> None:
    # === user_wines table ===
    # Add label_number to user_wines table (if not exists)
    if not column_exists('user_wines', 'label_number'):
        op.add_column('user_wines', sa.Column('label_number', sa.String(20), nullable=True))

    # Add index for label_number (if not exists)
    if not index_exists('user_wines', 'ix_user_wines_label_number'):
        op.create_index(op.f('ix_user_wines_label_number'), 'user_wines', ['label_number'], unique=False)

    # === users table ===
    # Add next_label_sequence to users table (if not exists)
    if not column_exists('users', 'next_label_sequence'):
        op.add_column('users', sa.Column('next_label_sequence', sa.Integer(), nullable=False, server_default='1'))

    # Add label_sequence_year to users table (if not exists)
    if not column_exists('users', 'label_sequence_year'):
        op.add_column('users', sa.Column('label_sequence_year', sa.Integer(), nullable=True))

    # === tags table cleanup ===
    # Remove deprecated columns from tags table (if exists)
    if column_exists('tags', 'abbreviation'):
        op.drop_column('tags', 'abbreviation')

    if column_exists('tags', 'next_sequence'):
        op.drop_column('tags', 'next_sequence')


def downgrade() -> None:
    # Restore tags columns
    if not column_exists('tags', 'abbreviation'):
        op.add_column('tags', sa.Column('abbreviation', sa.String(10), nullable=True))

    if not column_exists('tags', 'next_sequence'):
        op.add_column('tags', sa.Column('next_sequence', sa.Integer(), nullable=False, server_default='1'))

    # Remove users columns
    if column_exists('users', 'label_sequence_year'):
        op.drop_column('users', 'label_sequence_year')

    if column_exists('users', 'next_label_sequence'):
        op.drop_column('users', 'next_label_sequence')

    # Remove user_wines columns
    if index_exists('user_wines', 'ix_user_wines_label_number'):
        op.drop_index(op.f('ix_user_wines_label_number'), table_name='user_wines')

    if column_exists('user_wines', 'label_number'):
        op.drop_column('user_wines', 'label_number')
