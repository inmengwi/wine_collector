"""Add label number fields

Revision ID: 20260202_001
Revises:
Create Date: 2026-02-02

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '20260202_001'
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add abbreviation and next_sequence to tags table
    op.add_column('tags', sa.Column('abbreviation', sa.String(10), nullable=True))
    op.add_column('tags', sa.Column('next_sequence', sa.Integer(), nullable=False, server_default='1'))

    # Add label_number to user_wines table
    op.add_column('user_wines', sa.Column('label_number', sa.String(20), nullable=True))
    op.create_index(op.f('ix_user_wines_label_number'), 'user_wines', ['label_number'], unique=False)


def downgrade() -> None:
    # Remove label_number from user_wines
    op.drop_index(op.f('ix_user_wines_label_number'), table_name='user_wines')
    op.drop_column('user_wines', 'label_number')

    # Remove abbreviation and next_sequence from tags
    op.drop_column('tags', 'next_sequence')
    op.drop_column('tags', 'abbreviation')
