"""Add consumed_date and gifted_date to user wines.

Revision ID: 20260206_001
Revises: 20260203_001
Create Date: 2026-02-06
"""

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "20260206_001"
down_revision = "20260203_001"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("user_wines", sa.Column("consumed_date", sa.Date(), nullable=True))
    op.add_column("user_wines", sa.Column("gifted_date", sa.Date(), nullable=True))


def downgrade() -> None:
    op.drop_column("user_wines", "gifted_date")
    op.drop_column("user_wines", "consumed_date")
