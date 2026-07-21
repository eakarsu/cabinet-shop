#!/usr/bin/env bash
set -euo pipefail

if [[ -f .env ]]; then
  set -a
  # shellcheck disable=SC1091
  . ./.env
  set +a
fi

if [[ ! -d node_modules ]]; then
  echo "Dependencies are missing. Run: npm ci"
  exit 1
fi

if [[ -z "${DATABASE_URL:-}" ]]; then
  echo "DATABASE_URL is required. Copy .env.example to .env and configure it."
  exit 1
fi

if [[ "${RUN_MIGRATIONS:-0}" == "1" ]]; then
  echo "Applying checked-in database migrations..."
  npm run db:migrate
fi

if [[ "${RUN_SEED:-0}" == "1" ]]; then
  echo "Loading non-destructive catalog/reference data..."
  npm run db:seed
fi

if [[ "${NODE_ENV:-development}" == "test" && -f .next/standalone/server.js ]]; then
  : "${JWT_SECRET:?JWT_SECRET is required for test runtime secret isolation}"
  : "${JWT_REFRESH_SECRET:?JWT_REFRESH_SECRET is required for test runtime secret isolation}"
  export INTERNAL_API_TOKEN="${INTERNAL_API_TOKEN:-$JWT_SECRET}"
  export PRIVACY_HASH_SECRET="${PRIVACY_HASH_SECRET:-$JWT_REFRESH_SECRET}"
  export NEXTAUTH_URL="http://localhost:${PORT:-3000}"
  export HOSTNAME="${HOST:-127.0.0.1}"
  exec npm run start
fi

if [[ "${NODE_ENV:-development}" == "production" ]]; then
  if [[ ! -f .next/standalone/server.js ]]; then
    echo "Production build is missing. Run: npm run build"
    exit 1
  fi
  export HOSTNAME="${HOST:-127.0.0.1}"
  exec npm run start
fi

exec npm run dev -- --webpack --hostname "${HOST:-127.0.0.1}" --port "${PORT:-3000}"
