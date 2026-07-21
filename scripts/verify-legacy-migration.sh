#!/usr/bin/env bash
set -euo pipefail

legacy_url="${LEGACY_DATABASE_URL:?LEGACY_DATABASE_URL is required}"
if [[ "${legacy_url}" != *test* ]]; then
  echo "Refusing to run legacy migration verification outside a test database."
  exit 1
fi

psql "${legacy_url}" -v ON_ERROR_STOP=1 -f prisma/migrations/20260719000000_baseline/migration.sql >/dev/null
psql "${legacy_url}" -v ON_ERROR_STOP=1 <<'SQL' >/dev/null
INSERT INTO "QuoteRequest" (id,name,email,phone,status,"createdAt") VALUES ('legacy-q','Legacy Lead','Legacy@Example.com','(555) 123-4567','scheduled',CURRENT_TIMESTAMP);
INSERT INTO "Consultation" (id,name,email,phone,date,time,"createdAt") VALUES ('legacy-c','Legacy Lead','Legacy@Example.com','(555) 123-4567',CURRENT_TIMESTAMP,'09:00',CURRENT_TIMESTAMP);
INSERT INTO "User" (id,email,password,role,"createdAt") VALUES ('legacy-u','staff@example.com','disabled','admin',CURRENT_TIMESTAMP);
SQL
psql "${legacy_url}" -v ON_ERROR_STOP=1 -f prisma/migrations/20260719010000_sales_operations/migration.sql >/dev/null
result=$(psql "${legacy_url}" -Atc "SELECT CASE WHEN q.\"normalizedEmail\"='legacy@example.com' AND q.status='consultation_scheduled' AND q.\"contactId\"=c.\"contactId\" AND u.\"updatedAt\" IS NOT NULL AND (SELECT count(*) FROM \"Contact\")=1 THEN 'PASS' ELSE 'FAIL' END FROM \"QuoteRequest\" q CROSS JOIN \"Consultation\" c CROSS JOIN \"User\" u;")
test "${result}" = "PASS"
echo "Legacy migration backfill verified."

