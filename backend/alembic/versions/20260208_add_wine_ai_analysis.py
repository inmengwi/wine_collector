"""Add ai_analysis JSON column to wines table.

Revision ID: 20260208_002
Revises: 20260208_001
Create Date: 2026-02-08
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect
from sqlalchemy.dialects.postgresql import JSON


# revision identifiers, used by Alembic.
revision = "20260208_002"
down_revision = "20260208_001"
branch_labels = None
depends_on = None


def column_exists(table_name: str, column_name: str) -> bool:
    bind = op.get_bind()
    inspector = inspect(bind)
    columns = [col["name"] for col in inspector.get_columns(table_name)]
    return column_name in columns


def upgrade() -> None:
    if not column_exists("wines", "ai_analysis"):
        op.add_column("wines", sa.Column("ai_analysis", JSON, nullable=True))


def downgrade() -> None:
    if column_exists("wines", "ai_analysis"):
        op.drop_column("wines", "ai_analysis")
