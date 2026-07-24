#!/usr/bin/env bash
set -euo pipefail
ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$ROOT_DIR"
[[ -f .env ]] || { echo '.env is required' >&2; exit 1; }
migration_override="${RUN_MIGRATIONS:-}"
set -a; source .env; set +a
[[ -z "$migration_override" ]] || export RUN_MIGRATIONS="$migration_override"
required() { [[ -n "${!1:-}" ]] || { echo "$1 is required" >&2; exit 1; }; }
configure() {
  local name
  for name in DATABASE_URL NEXTAUTH_SECRET INTERNAL_API_TOKEN PRIVACY_HASH_SECRET BACKEND_PORT FRONTEND_PORT OPENROUTER_API_KEY OPENROUTER_MODEL OPENROUTER_BASE_URL; do required "$name"; done
  [[ "$OPENROUTER_BASE_URL" == 'https://openrouter.ai/api/v1' ]] || { echo 'OPENROUTER_BASE_URL is invalid' >&2; exit 1; }
  [[ "$BACKEND_PORT" =~ ^[0-9]+$ && "$FRONTEND_PORT" =~ ^[0-9]+$ && "$BACKEND_PORT" != "$FRONTEND_PORT" ]] || { echo 'runtime ports must be distinct numbers' >&2; exit 1; }
  [[ ${#NEXTAUTH_SECRET} -ge 32 && ${#INTERNAL_API_TOKEN} -ge 32 && ${#PRIVACY_HASH_SECRET} -ge 32 ]] || { echo 'runtime secrets must contain at least 32 characters' >&2; exit 1; }
  [[ "$NEXTAUTH_SECRET" != "$INTERNAL_API_TOKEN" && "$NEXTAUTH_SECRET" != "$PRIVACY_HASH_SECRET" && "$INTERNAL_API_TOKEN" != "$PRIVACY_HASH_SECRET" ]] || { echo 'runtime secrets must be distinct' >&2; exit 1; }
}
case "${1:-start}" in
  check) configure; npm run lint; npm run typecheck; npm test;;
  migrate) configure; [[ "${RUN_MIGRATIONS:-0}" == 1 ]] || { echo 'Refusing migration: set RUN_MIGRATIONS=1 explicitly' >&2; exit 1; }; npm run db:migrate;;
  start)
    configure
    [[ -d node_modules ]] || { echo 'dependencies are not installed' >&2; exit 1; }
    for port in "$BACKEND_PORT" "$FRONTEND_PORT"; do if lsof -nP -iTCP:"$port" -sTCP:LISTEN >/dev/null 2>&1; then echo "runtime port $port is occupied" >&2; exit 1; fi; done
    psql "$DATABASE_URL" -Atqc 'SELECT 1' >/dev/null
    echo "Starting Cabinet Shop API on $BACKEND_PORT and UI on $FRONTEND_PORT; persistent state is unchanged."
    exec node runtime-launcher.js;;
  *) echo "Usage: $0 [check|migrate|start]" >&2; exit 64;;
esac
