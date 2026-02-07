"""Add recommendation_cache table for caching AI recommendation results.

Revision ID: 20260207_001
Revises: 20260206_002
Create Date: 2026-02-07
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision = "20260207_001"
down_revision = "20260206_002"
branch_labels = None
depends_on = None


def table_exists(table_name: str) -> bool:
    bind = op.get_bind()
    inspector = inspect(bind)
    return table_name in inspector.get_table_names()


def upgrade() -> None:
    if not table_exists("recommendation_cache"):
        op.create_table(
            "recommendation_cache",
            sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
            sa.Column(
                "user_id",
                postgresql.UUID(as_uuid=True),
                sa.ForeignKey("users.id", ondelete="CASCADE"),
                nullable=False,
            ),
            sa.Column("cache_key", sa.String(length=64), nullable=False, unique=True),
            sa.Column("query_type", sa.String(length=20), nullable=False),
            sa.Column("query_text", sa.Text(), nullable=False),
            sa.Column("wine_collection_hash", sa.String(length=64), nullable=False),
            sa.Column("ai_result", postgresql.JSONB(), nullable=False),
            sa.Column("ai_model", sa.String(length=50), nullable=True),
            sa.Column("hit_count", sa.Integer(), nullable=False, server_default="0"),
            sa.Column("last_hit_at", sa.DateTime(timezone=True), nullable=True),
            sa.Column(
                "created_at",
                sa.DateTime(timezone=True),
                server_default=sa.text("now()"),
                nullable=False,
            ),
        )
        op.create_index(
            op.f("ix_recommendation_cache_user_id"),
            "recommendation_cache",
            ["user_id"],
            unique=False,
        )
        op.create_index(
            op.f("ix_recommendation_cache_cache_key"),
            "recommendation_cache",
            ["cache_key"],
            unique=True,
        )


def downgrade() -> None:
    if table_exists("recommendation_cache"):
        op.drop_index(
            op.f("ix_recommendation_cache_cache_key"),
            table_name="recommendation_cache",
        )
        op.drop_index(
            op.f("ix_recommendation_cache_user_id"),
            table_name="recommendation_cache",
        )
        op.drop_table("recommendation_cache")
