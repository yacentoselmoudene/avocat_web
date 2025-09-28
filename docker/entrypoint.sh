#!/usr/bin/env bash
set -euo pipefail

# Default values
: "${DJANGO_ENV:=development}"
: "${DB_HOST:=db}"
: "${DB_PORT:=3306}"
: "${DB_USER:=root}"
: "${DB_PASSWORD:=password}"
: "${DB_NAME:=cabinetavocat}"

# Wait for MySQL to be ready
function wait_for_mysql() {
  echo "Waiting for MySQL at ${DB_HOST}:${DB_PORT}..."
  for i in {1..60}; do
    if /usr/bin/env bash -c "/usr/bin/timeout 2 bash -lc 'cat < /dev/null > /dev/tcp/${DB_HOST}/${DB_PORT}'" 2>/dev/null; then
      echo "MySQL is reachable."
      return 0
    fi
    sleep 1
  done
  echo "MySQL did not become reachable in time." >&2
  return 1
}

wait_for_mysql

# Apply migrations
python manage.py migrate --noinput

# Collect static (optional for dev; harmless)
python manage.py collectstatic --noinput || true

# Run development server
exec python manage.py runserver 0.0.0.0:8000
