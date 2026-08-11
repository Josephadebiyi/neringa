#!/usr/bin/env bash
set -Eeuo pipefail
umask 077
: "${RESTIC_REPOSITORY:?RESTIC_REPOSITORY is required}"
: "${RESTIC_PASSWORD:?RESTIC_PASSWORD is required}"
: "${DR_RESTORE_DB_URL:?DR_RESTORE_DB_URL must point to the recovery target database}"

for command in restic pg_restore node; do
  command -v "$command" >/dev/null || { echo "Missing required command: $command" >&2; exit 1; }
done

target_identity="$(node -e "const u=new URL(process.env.DR_RESTORE_DB_URL);console.log(u.hostname+'/'+u.pathname.replace(/^\\//,''))")"
expected_confirmation="RESTORE:${target_identity}"
if [[ "${DR_CONFIRM_RESTORE:-}" != "$expected_confirmation" ]]; then
  echo "Restore refused. Set DR_CONFIRM_RESTORE=$expected_confirmation" >&2
  exit 1
fi
if [[ -n "${SUPABASE_DB_URL:-}" && "$DR_RESTORE_DB_URL" == "$SUPABASE_DB_URL" && "${DR_ALLOW_PRODUCTION_RESTORE:-}" != "I_UNDERSTAND_THIS_REPLACES_PRODUCTION" ]]; then
  echo "Production restore refused. Use an isolated recovery database for drills." >&2
  exit 1
fi

work_dir="$(mktemp -d "${TMPDIR:-/tmp}/bago-dr-restore.XXXXXX")"
cleanup() {
  local target="${work_dir:?}"
  [[ "$target" == "${TMPDIR:-/tmp}/bago-dr-restore."* ]] || return 1
  rm -rf -- "$target"
}
trap cleanup EXIT

snapshot="${DR_SNAPSHOT_ID:-latest}"
restic restore "$snapshot" --tag bago --target "$work_dir"
snapshot_dir="$(find "$work_dir" -type f -name postgres.dump -print -quit | xargs dirname)"
[[ -n "$snapshot_dir" ]] || { echo "No postgres.dump found in restored snapshot '$snapshot'" >&2; exit 1; }
test -f "$snapshot_dir/SHA256SUMS"
node scripts/dr/checksums.mjs verify "$snapshot_dir"

echo "Restoring PostgreSQL into $target_identity..."
PGCONNECT_TIMEOUT=15 PGDATABASE="$DR_RESTORE_DB_URL" pg_restore --clean --if-exists \
  --no-owner --no-privileges --exit-on-error "$snapshot_dir/postgres.dump"

if [[ "${DR_RESTORE_OBJECTS:-false}" == "true" ]]; then
  node scripts/dr/import-object-storage.mjs "$snapshot_dir/objects"
fi
echo "Restore completed. Run application smoke tests before directing traffic to this database."
