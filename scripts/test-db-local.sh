#!/usr/bin/env bash
# Testa migrations + RLS localmente com PostgreSQL nativo (sem Docker).
#
# Por quê: docs/DECISIONS.md (2026-08-03) — o stack completo do
# `supabase start` depende de imagens Docker que podem estar bloqueadas
# em alguns ambientes de execução. Este script recria o mesmo contrato
# público do schema `auth` via supabase/tests/fixtures/ e roda as
# migrations reais de supabase/migrations/ mais os testes pgTAP de
# supabase/tests/ contra um banco descartável.
#
# Requisitos: PostgreSQL rodando localmente (role `postgres` com acesso
# via socket Unix) e a extensão pgtap instalada (Ubuntu/Debian:
# `apt-get install postgresql-16-pgtap libtap-parser-sourcehandler-pgtap-perl`).
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DB_NAME="${TEST_DB_NAME:-pastescribe_test}"

# TCP + senha (não socket com peer auth) — mesmo método usado pelo
# serviço `postgres` do CI, então o comportamento é idêntico local/CI.
export PGHOST="${PGHOST:-127.0.0.1}"
export PGUSER="${PGUSER:-postgres}"
export PGPASSWORD="${PGPASSWORD:-postgres}"

PSQL="psql -v ON_ERROR_STOP=1"

echo "==> Recriando banco de teste ${DB_NAME}"
$PSQL -d postgres -c "DROP DATABASE IF EXISTS ${DB_NAME};"
$PSQL -d postgres -c "CREATE DATABASE ${DB_NAME};"

echo "==> Aplicando shim local do schema auth"
$PSQL -d "${DB_NAME}" -f "${ROOT_DIR}/supabase/tests/fixtures/00_local_auth_shim.sql"

echo "==> Aplicando migrations"
for migration in "${ROOT_DIR}"/supabase/migrations/*.sql; do
  echo "    -> $(basename "$migration")"
  $PSQL -d "${DB_NAME}" -f "$migration"
done

echo "==> Instalando extensão pgtap"
$PSQL -d "${DB_NAME}" -c "create extension if not exists pgtap;"

echo "==> Rodando testes pgTAP"
pg_prove -d "${DB_NAME}" "${ROOT_DIR}"/supabase/tests/*.sql

echo "==> Limpando banco de teste"
$PSQL -d postgres -c "DROP DATABASE IF EXISTS ${DB_NAME};"
