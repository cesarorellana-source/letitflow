#!/usr/bin/env bash
# Prueba las migraciones y la RLS contra un Postgres común (sin Docker ni Supabase).
#
# Uso:
#   pnpm test:db
#
# Conexión (en este orden):
#   1. TEST_DB_ADMIN_URL  p. ej. postgresql://postgres:postgres@localhost:5432/postgres
#   2. Si corres como root y existe `runuser`, usa el usuario del sistema "postgres" por socket.
#   3. En otro caso, usa el entorno estándar de psql (PGHOST, PGUSER, ...).
#
# Crea una base temporal, aplica un simulador mínimo de Supabase, las migraciones reales y las
# pruebas de supabase/tests/*.test.sql, y siempre borra la base al terminar.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DB="letitflow_test_$$"

admin_psql() {
  if [[ -n "${TEST_DB_ADMIN_URL:-}" ]]; then
    psql "$TEST_DB_ADMIN_URL" -v ON_ERROR_STOP=1 -q "$@"
  elif [[ "$(id -u)" == "0" ]] && command -v runuser >/dev/null; then
    runuser -u postgres -- psql -d postgres -v ON_ERROR_STOP=1 -q "$@"
  else
    psql -d postgres -v ON_ERROR_STOP=1 -q "$@"
  fi
}

db_psql() {
  if [[ -n "${TEST_DB_ADMIN_URL:-}" ]]; then
    local url="${TEST_DB_ADMIN_URL%/*}/$DB"
    psql "$url" -v ON_ERROR_STOP=1 -q "$@"
  elif [[ "$(id -u)" == "0" ]] && command -v runuser >/dev/null; then
    runuser -u postgres -- psql -d "$DB" -v ON_ERROR_STOP=1 -q "$@"
  else
    psql -d "$DB" -v ON_ERROR_STOP=1 -q "$@"
  fi
}

# runuser no puede leer archivos de /root: pasamos el SQL por stdin.
run_file() {
  db_psql < "$1"
}

cleanup() {
  admin_psql -c "drop database if exists \"$DB\" with (force)" >/dev/null 2>&1 || true
}
trap cleanup EXIT

admin_psql -c "create database \"$DB\""

echo "→ simulador de Supabase"
run_file "$ROOT/supabase/tests/helpers/00_supabase_stub.sql"

echo "→ migraciones"
for f in "$ROOT"/supabase/migrations/*.sql; do
  echo "   $(basename "$f")"
  run_file "$f"
done

echo "→ utilidades de prueba"
run_file "$ROOT/supabase/tests/helpers/01_test_helpers.sql"

echo "→ pruebas"
for f in "$ROOT"/supabase/tests/*.test.sql; do
  run_file "$f"
done

echo "Todas las pruebas de base de datos pasaron."
