#!/usr/bin/env bash
set -Eeuo pipefail
umask 077

for command in pg_dump pg_restore restic node; do
  command -v "$command" >/dev/null || { echo "Missing required command: $command" >&2; exit 1; }
done
: "${SUPABASE_DB_URL:?SUPABASE_DB_URL is required}"
: "${RESTIC_REPOSITORY:?RESTIC_REPOSITORY is required}"
: "${RESTIC_PASSWORD:?RESTIC_PASSWORD is required}"

work_dir="$(mktemp -d "${TMPDIR:-/tmp}/bago-dr-backup.XXXXXX")"
cleanup() {
  local target="${work_dir:?}"
  [[ "$target" == "${TMPDIR:-/tmp}/bago-dr-backup."* ]] || return 1
  rm -rf -- "$target"
}
trap cleanup EXIT

snapshot_dir="$work_dir/snapshot"
mkdir -p "$snapshot_dir"
timestamp="$(date -u +%Y%m%dT%H%M%SZ)"

echo "Creating PostgreSQL backup..."
PGCONNECT_TIMEOUT=15 PGDATABASE="$SUPABASE_DB_URL" pg_dump --format=custom --compress=9 \
  --no-owner --no-privileges --file="$snapshot_dir/postgres.dump"
pg_restore --list "$snapshot_dir/postgres.dump" > "$snapshot_dir/postgres.contents"

echo "Exporting object storage..."
node scripts/dr/export-object-storage.mjs "$snapshot_dir/objects"

node -e "const fs=require('fs');const os=require('os');const manifest={createdAt:new Date().toISOString(),host:os.hostname(),database:'postgres',schemaVersion:1,gitCommit:process.env.RENDER_GIT_COMMIT||process.env.GITHUB_SHA||null};fs.writeFileSync(process.argv[1],JSON.stringify(manifest,null,2),{mode:0o600})" "$snapshot_dir/manifest.json"
node scripts/dr/checksums.mjs create "$snapshot_dir"

if ! restic snapshots >/dev/null 2>&1; then
  echo "Initializing encrypted Restic repository..."
  restic init
fi

restic backup "$snapshot_dir" --tag bago --tag production --tag "$timestamp"
restic forget --keep-daily 14 --keep-weekly 8 --keep-monthly 12 --keep-yearly 3 --prune
restic check --read-data-subset=5%

if [[ -n "${DR_HEALTHCHECK_URL:-}" ]]; then
  curl --fail --silent --show-error --max-time 15 "$DR_HEALTHCHECK_URL" >/dev/null
fi
echo "Encrypted disaster-recovery snapshot completed: $timestamp"
