"""Add label number fields

Revision ID: 20260202_001
Revises:
Create Date: 2026-02-02

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
    columns = [col['name'] for col in inspector.get_columns(table_name)]
    return column_name in columns


def upgrade() -> None:
    # Add abbreviation to tags table (if not exists)
    if not column_exists('tags', 'abbreviation'):
        op.add_column('tags', sa.Column('abbreviation', sa.String(10), nullable=True))

    # Add next_sequence to tags table (if not exists)
    if not column_exists('tags', 'next_sequence'):
        op.add_column('tags', sa.Column('next_sequence', sa.Integer(), nullable=False, server_default='1'))

    # Add label_number to user_wines table (if not exists)
    if not column_exists('user_wines', 'label_number'):
        op.add_column('user_wines', sa.Column('label_number', sa.String(20), nullable=True))
        op.create_index(op.f('ix_user_wines_label_number'), 'user_wines', ['label_number'], unique=False)


def downgrade() -> None:
    # Remove label_number from user_wines
    if column_exists('user_wines', 'label_number'):
        op.drop_index(op.f('ix_user_wines_label_number'), table_name='user_wines')
        op.drop_column('user_wines', 'label_number')

    # Remove abbreviation and next_sequence from tags
    if column_exists('tags', 'next_sequence'):
        op.drop_column('tags', 'next_sequence')
    if column_exists('tags', 'abbreviation'):
        op.drop_column('tags', 'abbreviation')
