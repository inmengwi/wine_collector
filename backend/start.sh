#!/bin/bash
set -e

echo "=== Starting Wine Collector API ==="

# Reset alembic version table to handle revision conflicts
echo "Resetting alembic version..."
python -c "
import os
from sqlalchemy import create_engine, text

db_url = os.environ.get('DATABASE_URL', '')
# Convert async driver to sync driver
db_url = db_url.replace('postgresql+asyncpg', 'postgresql+psycopg2')
db_url = db_url.replace('asyncpg', 'psycopg2')

try:
    engine = create_engine(db_url)
    with engine.connect() as conn:
        conn.execute(text('DELETE FROM alembic_version'))
        conn.commit()
    print('Cleared alembic_version table')
except Exception as e:
    print(f'Note: Could not clear alembic_version (may not exist yet): {e}')
" || true

# Run database migrations
echo "Running database migrations..."
alembic upgrade head

echo "Migrations complete. Starting uvicorn..."

# Start the application
exec uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000} --log-config uvicorn_log_config.json
