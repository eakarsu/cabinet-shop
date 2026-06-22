#!/usr/bin/env bash
set -euo pipefail

APP_PORT="${PORT:-3000}"
DB_NAME="cabinet_shop_db"

echo "=========================================="
echo "  Heritage Cabinet & Stone - Startup"
echo "=========================================="
echo ""

# Load .env so this script's checks see the same vars Next.js loads at runtime
# (DATABASE_URL, NEXTAUTH_URL, OPENROUTER_API_KEY, ...).
if [ -f .env ]; then
  echo "==> Loading .env"
  set -a
  # shellcheck disable=SC1091
  . ./.env
  set +a
fi

# Default DATABASE_URL if not provided (uses current macOS user, like the restaurant app)
if [[ -z "${DATABASE_URL:-}" ]]; then
  DB_USER="${USER:-$(whoami)}"
  export DATABASE_URL="postgresql://${DB_USER}@localhost:5432/${DB_NAME}?schema=public"
fi
echo "DATABASE_URL: ${DATABASE_URL}"
export NEXTAUTH_URL="${NEXTAUTH_URL:-http://localhost:${APP_PORT}}"
echo "NEXTAUTH_URL: ${NEXTAUTH_URL}"
echo ""

# Connection flags for psql/createdb. Honor PGHOST if set, otherwise try the
# local socket first (default on Homebrew/Postgres.app) and fall back to TCP.
PG_CONN=""
if psql -tAc "SELECT 1" postgres >/dev/null 2>&1; then
  PG_CONN=""           # local socket works
elif psql -h localhost -tAc "SELECT 1" postgres >/dev/null 2>&1; then
  PG_CONN="-h localhost"
fi

# Check PostgreSQL
echo "==> Checking PostgreSQL status..."
if ! command -v psql &> /dev/null; then
  echo "WARNING: psql not found. Assuming PostgreSQL is configured correctly."
else
  if ! psql ${PG_CONN} -tAc "SELECT 1" postgres >/dev/null 2>&1; then
    echo ""
    echo "ERROR: Cannot connect to PostgreSQL server."
    echo "  macOS:  brew services start postgresql   (or open Postgres.app)"
    echo "  Linux:  sudo systemctl start postgresql"
    exit 1
  fi
  echo "PostgreSQL server is running."

  echo ""
  echo "==> Ensuring database '${DB_NAME}' exists..."
  # Reliable existence check via pg_database (no column-spacing parsing).
  DB_EXISTS=$(psql ${PG_CONN} -tAc "SELECT 1 FROM pg_database WHERE datname='${DB_NAME}'" postgres 2>/dev/null || echo "")
  if [ "${DB_EXISTS}" = "1" ]; then
    echo "Database '${DB_NAME}' already exists."
  else
    echo "Creating database '${DB_NAME}'..."
    if createdb ${PG_CONN} "${DB_NAME}" 2>/tmp/cabinet_createdb_err; then
      echo "Database created."
    elif grep -qi "already exists" /tmp/cabinet_createdb_err; then
      echo "Database '${DB_NAME}' already exists."
    else
      echo ""
      echo "ERROR: could not create database '${DB_NAME}'. createdb said:"
      sed 's/^/    /' /tmp/cabinet_createdb_err
      echo ""
      echo "Common fixes:"
      echo "  • Your DB role may lack CREATEDB. Create it as the postgres superuser:"
      echo "      psql ${PG_CONN} -d postgres -c 'CREATE DATABASE ${DB_NAME};'"
      echo "  • Or grant your user the right:  ALTER ROLE \"${USER}\" CREATEDB;"
      exit 1
    fi
  fi
fi

# Free the app port
echo ""
echo "==> Cleaning up processes on port ${APP_PORT}..."
if lsof -ti tcp:"${APP_PORT}" >/dev/null 2>&1; then
  lsof -ti tcp:"${APP_PORT}" | xargs kill -9 || true
  sleep 1
  echo "Freed port ${APP_PORT}."
else
  echo "No processes on port ${APP_PORT}."
fi

# Dependencies
if [ ! -d "node_modules" ]; then
  echo ""
  echo "==> Installing dependencies..."
  npm install
fi

# Prisma client + schema
echo ""
echo "==> Generating Prisma client..."
npx prisma generate

echo ""
echo "==> Pushing schema to the database..."
npx prisma db push || {
  echo "Schema push failed. Retrying with reset..."
  npx prisma db push --force-reset
}

# Seed if empty
echo ""
echo "==> Checking if database needs seeding..."
PSQL_URL=$(echo "${DATABASE_URL}" | sed 's/?schema=.*//')
MAT_COUNT=$(psql "${PSQL_URL}" -t -c "SELECT COUNT(*) FROM \"Material\";" 2>/dev/null | xargs || echo "0")
if [ "${MAT_COUNT}" = "0" ] || [ -z "${MAT_COUNT}" ]; then
  echo "Database empty. Seeding..."
  DATABASE_URL="${DATABASE_URL}" npm run db:seed
else
  echo "Database already has ${MAT_COUNT} materials. Skipping seed."
fi

echo ""
echo "=========================================="
echo "  Starting Heritage Cabinet & Stone"
echo "  http://localhost:${APP_PORT}"
echo "=========================================="
echo ""
echo "Login (auto-filled on the /login page):"
echo "  Admin:    admin@heritage.com / admin123   -> /admin"
echo "  Customer: avery@example.com  / customer123 -> /account"
echo ""
if [ -z "${OPENROUTER_API_KEY:-}" ]; then
  echo "NOTE: OPENROUTER_API_KEY is not set — the AI concierge will be disabled."
  echo "      Set it in .env to enable the chat widget."
  echo ""
fi

if [ "${NODE_ENV:-development}" = "production" ]; then
  echo "Running in PRODUCTION mode..."
  npm run build
  npm run start
else
  echo "Running in DEVELOPMENT mode..."
  npm run dev
fi
