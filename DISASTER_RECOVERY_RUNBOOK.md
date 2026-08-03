# Bago Disaster Recovery Runbook

## Status

The repository contains the backup and restore system, but disaster recovery is **not active** until the required GitHub secrets are configured and the first scheduled backup and restore drill both pass.

## Recovery objectives

| System | Initial RPO | Initial RTO | Recovery source |
|---|---:|---:|---|
| PostgreSQL transactional data | 24 hours | 4 hours | Daily encrypted Restic snapshot plus Supabase native backups when enabled |
| Supabase Storage | 7 days | 8 hours | Weekly encrypted Restic snapshot |
| Cloudinary uploads | 7 days | 8 hours | Weekly encrypted Restic snapshot |
| Backend, web and admin code | Last pushed commit | 2 hours | Git repository and rebuilt artifacts |
| Provider configuration and secrets | Last secret-manager update | 4 hours | Provider secret manager; never the repository |

After 30 days of successful drills, enable Supabase point-in-time recovery where the production plan supports it and revise the database RPO toward one hour or better.

## Backup design

- `scripts/dr/backup.sh` creates a compressed PostgreSQL custom-format dump.
- Supabase Storage and Cloudinary objects are exported with manifests.
- SHA-256 checksums cover every captured file.
- Restic encrypts and deduplicates the snapshot before upload to S3-compatible off-site storage.
- Retention is 14 daily, 8 weekly, 12 monthly and 3 yearly snapshots.
- Every backup validates the PostgreSQL archive and checks a sample of repository data.
- `.github/workflows/disaster-recovery-backup.yml` runs database backups daily and full object backups weekly.
- `.github/workflows/disaster-recovery-drill.yml` restores the latest snapshot into isolated PostgreSQL monthly.

Use an object-storage account that is separate from Supabase, Cloudinary and Render. Enable bucket versioning/object lock, MFA on the owner account, lifecycle protection and billing alerts.

## Required GitHub secrets

- `SUPABASE_DB_URL`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`
- `DR_RESTIC_REPOSITORY`
- `DR_RESTIC_PASSWORD`
- `DR_AWS_ACCESS_KEY_ID`
- `DR_AWS_SECRET_ACCESS_KEY`
- `DR_AWS_DEFAULT_REGION`
- `DR_HEALTHCHECK_URL` (recommended dead-man alert URL)

By default, the exporter captures every asset in the configured Cloudinary product environment, including legacy `requests/` objects and current `bago/` folders. Set `DR_CLOUDINARY_PREFIX` only if that environment is shared and the excluded assets have their own independent backup.

Store a second offline copy of `DR_RESTIC_PASSWORD` in the company password vault. Losing it makes every backup unrecoverable. The backup credential should have write access only to the DR bucket; restore credentials should be issued only during an incident.

## Activation checklist

1. Create a private off-site S3-compatible bucket in a separate provider/account.
2. Enable bucket versioning and object lock where supported.
3. Configure all GitHub secrets listed above.
4. Run **Disaster recovery backup** manually with object storage enabled.
5. Confirm the workflow and dead-man health check succeed.
6. Run **Disaster recovery restore drill** manually.
7. Confirm tables are restored and record elapsed time.
8. Test application login, trip listing, shipment history, chat history, wallet ledger and admin access against an isolated recovery deployment.
9. Record the drill date, snapshot ID, recovery duration and operator in the incident log.

## Incident procedure

1. Declare an incident and appoint one incident commander.
2. Stop writes if continued writes can worsen corruption; preserve logs and provider audit trails.
3. Determine whether the fault is application, database, storage, credentials or provider-wide.
4. Record the incident start time and the last known-good transaction time.
5. Rotate compromised credentials before restoring if compromise is suspected.
6. Restore into a new isolated database first. Never test a restore over production.
7. Validate row counts, wallet ledger invariants, pending payouts, shipment status, message history and KYC references.
8. Restore object storage only with `DR_CONFIRM_OBJECT_RESTORE=RESTORE_OBJECTS`; this overwrites matching remote objects.
9. Deploy a recovery backend connected to the isolated database and run smoke tests.
10. Switch traffic only after two authorized operators approve the recovered state.
11. Monitor errors, payment webhooks, queues and balances closely after cutover.
12. Preserve the failed environment for investigation and complete a post-incident review.

## Manual commands

Run from `BAGO_BACKEND` after exporting secrets from a secure manager:

```bash
npm run dr:backup
npm run dr:verify
```

Restore into an isolated target:

```bash
export DR_RESTORE_DB_URL='postgresql://user:password@recovery-host:5432/recovery-db'
export DR_CONFIRM_RESTORE='RESTORE:recovery-host/recovery-db'
npm run dr:restore
```

Production replacement requires the additional exact acknowledgement:

```bash
export DR_ALLOW_PRODUCTION_RESTORE='I_UNDERSTAND_THIS_REPLACES_PRODUCTION'
```

## Quarterly review

- Verify the backup account is independent and MFA-protected.
- Verify retention and object-lock settings.
- Rotate backup access keys and test the new keys.
- Confirm an offline copy of the Restic password exists.
- Run a complete application recovery drill, including one sample image/document.
- Review RPO/RTO performance and update this runbook.
