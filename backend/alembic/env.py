"""Alembic migration environment."""

from logging.config import fileConfig

from alembic import context
from sqlalchemy import pool, create_engine

from app.config import settings
from app.database import Base

# Import all models to ensure they are registered with Base
from app.models import (  # noqa: F401
    User,
    RefreshToken,
    Wine,
    UserWine,
    Tag,
    UserWineTag,
    Recommendation,
)

# this is the Alembic Config object
config = context.config


def get_sync_database_url() -> str:
    """Convert async database URL to sync for alembic."""
    url = settings.database_url
    # Convert asyncpg to psycopg2 for sync migrations
    if "postgresql+asyncpg" in url:
        url = url.replace("postgresql+asyncpg", "postgresql+psycopg2")
    elif "asyncpg" in url:
        url = url.replace("asyncpg", "psycopg2")
    return url


# Set sqlalchemy.url from settings (using sync driver)
config.set_main_option("sqlalchemy.url", get_sync_database_url())

# Interpret the config file for Python logging.
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# Model's MetaData object for 'autogenerate' support
target_metadata = Base.metadata


def run_migrations_offline() -> None:
    """Run migrations in 'offline' mode."""
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    """Run migrations in 'online' mode with sync engine."""
    connectable = create_engine(
        get_sync_database_url(),
        poolclass=pool.NullPool,
    )

    with connectable.connect() as connection:
        context.configure(connection=connection, target_metadata=target_metadata)

        with context.begin_transaction():
            context.run_migrations()

    connectable.dispose()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
