#!/usr/bin/env bash
set -euo pipefail

DB_NAME="${GIGXOMI_DB_NAME:-gigxomi}"
DB_USER="${GIGXOMI_DB_USER:-gigxomi_app}"
DB_PASSWORD="${GIGXOMI_DB_PASSWORD:-}"

if [[ -z "${DB_PASSWORD}" ]]; then
  echo "Set GIGXOMI_DB_PASSWORD before running this script." >&2
  exit 1
fi

if ! command -v psql >/dev/null 2>&1; then
  apt-get update
  apt-get install -y postgresql postgresql-contrib
fi

systemctl enable --now postgresql

sudo -u postgres psql <<SQL
DO
\$do\$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = '${DB_USER}') THEN
    CREATE ROLE ${DB_USER} LOGIN PASSWORD '${DB_PASSWORD}';
  ELSE
    ALTER ROLE ${DB_USER} WITH LOGIN PASSWORD '${DB_PASSWORD}';
  END IF;
END
\$do\$;

SELECT 'CREATE DATABASE ${DB_NAME} OWNER ${DB_USER}'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = '${DB_NAME}')\\gexec

GRANT ALL PRIVILEGES ON DATABASE ${DB_NAME} TO ${DB_USER};
SQL

echo "Postgres is ready for Gigxomi."
echo "DATABASE_URL=postgresql://${DB_USER}:<password>@127.0.0.1:5432/${DB_NAME}?schema=public"
