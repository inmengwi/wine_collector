"""Add user profile fields (birth_year, language, nationality, gender, wine_preferences).

Revision ID: 20260208_001
Revises: 20260207_001
Create Date: 2026-02-08
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect


# revision identifiers, used by Alembic.
revision = "20260208_001"
down_revision = "20260207_001"
branch_labels = None
depends_on = None


def column_exists(table_name: str, column_name: str) -> bool:
    bind = op.get_bind()
    inspector = inspect(bind)
    columns = [col["name"] for col in inspector.get_columns(table_name)]
    return column_name in columns


def upgrade() -> None:
    for col_name, col_type in [
        ("birth_year", sa.Integer()),
        ("language", sa.String(length=10)),
        ("nationality", sa.String(length=100)),
        ("gender", sa.String(length=20)),
        ("wine_preferences", sa.Text()),
    ]:
        if not column_exists("users", col_name):
            op.add_column("users", sa.Column(col_name, col_type, nullable=True))


def downgrade() -> None:
    for col_name in ["wine_preferences", "gender", "nationality", "language", "birth_year"]:
        if column_exists("users", col_name):
            op.drop_column("users", col_name)
