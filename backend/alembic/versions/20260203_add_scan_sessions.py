"""Add scan sessions table.

Revision ID: 20260203_001
Revises: 20260202_001
Create Date: 2026-02-03
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision = "20260203_001"
down_revision = "20260202_001"
branch_labels = None
depends_on = None


def table_exists(table_name: str) -> bool:
    bind = op.get_bind()
    inspector = inspect(bind)
    try:
        return table_name in inspector.get_table_names()
    except Exception:
        return False


def upgrade() -> None:
    if table_exists("scan_sessions"):
        return

    op.create_table(
        "scan_sessions",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("scan_id", sa.String(length=64), nullable=False, unique=True),
        sa.Column(
            "image_urls",
            postgresql.JSONB(astext_type=sa.Text()),
            nullable=False,
            server_default=sa.text("'[]'::jsonb"),
        ),
        sa.Column(
            "wine_data",
            postgresql.JSONB(astext_type=sa.Text()),
            nullable=False,
            server_default=sa.text("'{}'::jsonb"),
        ),
        sa.Column("confidence", sa.Numeric(4, 3), nullable=True),
        sa.Column("existing_wine_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("wines.id", ondelete="SET NULL"), nullable=True),
        sa.Column("is_duplicate", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
    )
    op.create_index(op.f("ix_scan_sessions_user_id"), "scan_sessions", ["user_id"], unique=False)
    op.create_index(op.f("ix_scan_sessions_scan_id"), "scan_sessions", ["scan_id"], unique=True)


def downgrade() -> None:
    if not table_exists("scan_sessions"):
        return

    op.drop_index(op.f("ix_scan_sessions_scan_id"), table_name="scan_sessions")
    op.drop_index(op.f("ix_scan_sessions_user_id"), table_name="scan_sessions")
    op.drop_table("scan_sessions")
