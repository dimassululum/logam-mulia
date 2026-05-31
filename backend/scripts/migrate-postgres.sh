#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BACKUP_DIR="${BACKUP_DIR:-$ROOT_DIR/db-backups}"
TIMESTAMP="$(date +%Y%m%d-%H%M%S)"
DUMP_FILE="${DUMP_FILE:-$BACKUP_DIR/neon-$TIMESTAMP.dump}"

if ! command -v pg_dump >/dev/null 2>&1; then
  echo "pg_dump tidak ditemukan. Install PostgreSQL client dulu." >&2
  exit 1
fi

if ! command -v pg_restore >/dev/null 2>&1; then
  echo "pg_restore tidak ditemukan. Install PostgreSQL client dulu." >&2
  exit 1
fi

if ! command -v psql >/dev/null 2>&1; then
  echo "psql tidak ditemukan. Install PostgreSQL client dulu." >&2
  exit 1
fi

if [[ -z "${SOURCE_DATABASE_URL:-}" && -f "$ROOT_DIR/.env" ]]; then
  SOURCE_DATABASE_URL="$(
    node -e '
      const fs = require("fs");
      const env = fs.readFileSync(process.argv[1], "utf8");
      const line = env.split(/\r?\n/).find((entry) => entry.trim().startsWith("DATABASE_URL="));
      if (!line) process.exit(1);
      const value = line.slice(line.indexOf("=") + 1).trim().replace(/^["'\'']|["'\'']$/g, "");
      process.stdout.write(value);
    ' "$ROOT_DIR/.env"
  )"
fi

if [[ -z "${SOURCE_DATABASE_URL:-}" ]]; then
  echo "SOURCE_DATABASE_URL kosong. Isi dengan URL database Neon, atau pastikan backend/.env punya DATABASE_URL." >&2
  exit 1
fi

if [[ -z "${TARGET_DATABASE_URL:-}" ]]; then
  echo "TARGET_DATABASE_URL kosong. Contoh:" >&2
  echo "TARGET_DATABASE_URL='postgresql://user:password@host:5432/dbname?sslmode=disable' bash backend/scripts/migrate-postgres.sh" >&2
  exit 1
fi

mkdir -p "$BACKUP_DIR"

echo "Membuat dump dari source ke: $DUMP_FILE"
pg_dump "$SOURCE_DATABASE_URL" \
  --format=custom \
  --no-owner \
  --no-privileges \
  --file="$DUMP_FILE"

TARGET_TABLE_COUNT="$(
  psql "$TARGET_DATABASE_URL" -tAc "select count(*) from information_schema.tables where table_schema = 'public' and table_type = 'BASE TABLE';"
)"

if [[ "$TARGET_TABLE_COUNT" != "0" && "${ALLOW_CLEAN_RESTORE:-false}" != "true" ]]; then
  echo "Target punya $TARGET_TABLE_COUNT tabel. Restore dibatalkan supaya tidak overwrite tanpa sengaja." >&2
  echo "Kalau memang ingin overwrite schema public target, jalankan lagi dengan ALLOW_CLEAN_RESTORE=true." >&2
  exit 1
fi

RESTORE_FLAGS=(--no-owner --no-privileges --dbname "$TARGET_DATABASE_URL")

if [[ "${ALLOW_CLEAN_RESTORE:-false}" == "true" ]]; then
  RESTORE_FLAGS=(--clean --if-exists "${RESTORE_FLAGS[@]}")
fi

echo "Restore dump ke target..."
pg_restore "${RESTORE_FLAGS[@]}" "$DUMP_FILE"

echo "Validasi jumlah tabel target..."
psql "$TARGET_DATABASE_URL" -c "select schemaname, count(*) as table_count from pg_tables where schemaname = 'public' group by schemaname;"

echo "Selesai. Backup tersimpan di $DUMP_FILE"
