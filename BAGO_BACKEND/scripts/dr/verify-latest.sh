#!/usr/bin/env bash
set -Eeuo pipefail
umask 077
: "${RESTIC_REPOSITORY:?RESTIC_REPOSITORY is required}"
: "${RESTIC_PASSWORD:?RESTIC_PASSWORD is required}"
command -v restic >/dev/null || { echo "restic is required" >&2; exit 1; }
command -v pg_restore >/dev/null || { echo "pg_restore is required" >&2; exit 1; }

work_dir="$(mktemp -d "${TMPDIR:-/tmp}/bago-dr-verify.XXXXXX")"
cleanup() {
  local target="${work_dir:?}"
  [[ "$target" == "${TMPDIR:-/tmp}/bago-dr-verify."* ]] || return 1
  rm -rf -- "$target"
}
trap cleanup EXIT

restic check --read-data-subset="${DR_VERIFY_DATA_SUBSET:-10%}"
restic restore latest --tag bago --target "$work_dir"
snapshot_dir="$(find "$work_dir" -type f -name postgres.dump -print -quit | xargs dirname)"
test -n "$snapshot_dir" && test -f "$snapshot_dir/manifest.json" && test -f "$snapshot_dir/SHA256SUMS"
node scripts/dr/checksums.mjs verify "$snapshot_dir"
pg_restore --list "$snapshot_dir/postgres.dump" >/dev/null
node -e "const fs=require('fs');const m=JSON.parse(fs.readFileSync(process.argv[1]));if(!m.createdAt||m.schemaVersion!==1)process.exit(1);console.log('Verified backup created at',m.createdAt)" "$snapshot_dir/manifest.json"
echo "Latest disaster-recovery snapshot is structurally valid."
