"""Add user profile fields (birth_year, language, nationality, gender, wine_preferences).

Revision ID: 20260208_001
Revises: 20260207_001
Create Date: 2026-02-08
"""

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "20260208_001"
down_revision = "20260207_001"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("users", sa.Column("birth_year", sa.Integer(), nullable=True))
    op.add_column("users", sa.Column("language", sa.String(length=10), nullable=True))
    op.add_column("users", sa.Column("nationality", sa.String(length=100), nullable=True))
    op.add_column("users", sa.Column("gender", sa.String(length=20), nullable=True))
    op.add_column("users", sa.Column("wine_preferences", sa.Text(), nullable=True))


def downgrade() -> None:
    op.drop_column("users", "wine_preferences")
    op.drop_column("users", "gender")
    op.drop_column("users", "nationality")
    op.drop_column("users", "language")
    op.drop_column("users", "birth_year")
