"""Create user wine status histories table and remove single-date columns.

Revision ID: 20260206_002
Revises: 20260206_001
Create Date: 2026-02-06
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision = "20260206_002"
down_revision = "20260206_001"
branch_labels = None
depends_on = None


def table_exists(table_name: str) -> bool:
    bind = op.get_bind()
    inspector = inspect(bind)
    return table_name in inspector.get_table_names()


def column_exists(table_name: str, column_name: str) -> bool:
    bind = op.get_bind()
    inspector = inspect(bind)
    columns = [c["name"] for c in inspector.get_columns(table_name)]
    return column_name in columns


def upgrade() -> None:
    if not table_exists("user_wine_status_histories"):
        op.create_table(
            "user_wine_status_histories",
            sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
            sa.Column(
                "user_wine_id",
                postgresql.UUID(as_uuid=True),
                sa.ForeignKey("user_wines.id", ondelete="CASCADE"),
                nullable=False,
            ),
            sa.Column("status", sa.String(length=20), nullable=False),
            sa.Column("event_date", sa.Date(), nullable=False),
            sa.Column("quantity", sa.Integer(), nullable=False, server_default="1"),
            sa.Column("rating", sa.Integer(), nullable=True),
            sa.Column("note", sa.Text(), nullable=True),
            sa.Column("recipient", sa.String(length=200), nullable=True),
            sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        )
        op.create_index(op.f("ix_user_wine_status_histories_user_wine_id"), "user_wine_status_histories", ["user_wine_id"], unique=False)
        op.create_index(op.f("ix_user_wine_status_histories_status"), "user_wine_status_histories", ["status"], unique=False)

    if column_exists("user_wines", "consumed_date"):
        op.drop_column("user_wines", "consumed_date")
    if column_exists("user_wines", "gifted_date"):
        op.drop_column("user_wines", "gifted_date")


def downgrade() -> None:
    if not column_exists("user_wines", "consumed_date"):
        op.add_column("user_wines", sa.Column("consumed_date", sa.Date(), nullable=True))
    if not column_exists("user_wines", "gifted_date"):
        op.add_column("user_wines", sa.Column("gifted_date", sa.Date(), nullable=True))

    if table_exists("user_wine_status_histories"):
        op.drop_index(op.f("ix_user_wine_status_histories_status"), table_name="user_wine_status_histories")
        op.drop_index(op.f("ix_user_wine_status_histories_user_wine_id"), table_name="user_wine_status_histories")
        op.drop_table("user_wine_status_histories")
