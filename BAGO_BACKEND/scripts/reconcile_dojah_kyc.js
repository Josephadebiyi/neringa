import dotenv from 'dotenv';

import { query } from '../lib/postgres/db.js';
import { markKycApproved } from '../lib/postgres/accounts.js';

dotenv.config();

const APPLY = process.argv.includes('--apply');

const normalizeValue = (value) => {
  if (value == null) return '';
  if (typeof value === 'string') return value.toLowerCase().trim();
  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value).toLowerCase().trim();
  }
  if (Array.isArray(value)) {
    return value.map(normalizeValue).find(Boolean) || '';
  }
  if (typeof value === 'object') {
    for (const key of [
      'status',
      'value',
      'decision',
      'result',
      'verificationStatus',
      'verification_status',
      'state',
      'name',
      'message',
    ]) {
      const normalized = normalizeValue(value[key]);
      if (normalized && normalized !== 'true' && normalized !== 'false') {
        return normalized;
      }
    }
  }
  return '';
};

const firstValue = (...values) => {
  for (const value of values) {
    const normalized = normalizeValue(value);
    if (normalized) return normalized;
  }
  return '';
};

const statusFromPayload = (payload = {}) =>
  firstValue(
    payload?.data?.status,
    payload?.data?.verification_status,
    payload?.data?.verificationStatus,
    payload?.data?.decision,
    payload?.data?.result,
    payload?.data?.verification?.status,
    payload?.status,
    payload?.verification_status,
    payload?.verificationStatus,
    payload?.decision,
    payload?.result,
  );

const approvedStatuses = new Set(['success', 'approved', 'verified', 'completed']);

async function main() {
  const result = await query(
    `
      select id, email, kyc_status, kyc_provider, kyc_verified_data
      from public.profiles
      where kyc_provider = 'dojah'
        and coalesce(kyc_status, 'not_started') <> 'approved'
        and kyc_verified_data is not null
      order by updated_at desc nulls last, created_at desc nulls last
    `,
  );

  let approved = 0;
  let duplicates = 0;
  let skipped = 0;

  for (const row of result.rows) {
    const status = statusFromPayload(row.kyc_verified_data);
    if (!approvedStatuses.has(status)) {
      skipped += 1;
      console.log(`skip ${row.id} ${row.email || ''} status=${status || 'unknown'}`);
      continue;
    }

    if (!APPLY) {
      approved += 1;
      console.log(`would approve ${row.id} ${row.email || ''} status=${status}`);
      continue;
    }

    const outcome = await markKycApproved(row.id, {
      provider: 'dojah',
      kycVerifiedData: row.kyc_verified_data,
    });

    if (outcome?.duplicate) {
      duplicates += 1;
      console.log(`blocked duplicate ${row.id} duplicate=${outcome.duplicateUserId}`);
    } else {
      approved += 1;
      console.log(`approved ${row.id} ${row.email || ''}`);
    }
  }

  console.log(
    JSON.stringify(
      {
        mode: APPLY ? 'apply' : 'dry-run',
        scanned: result.rows.length,
        approved,
        duplicates,
        skipped,
      },
      null,
      2,
    ),
  );
}

main().catch((error) => {
  console.error('reconcile_dojah_kyc failed:', error);
  process.exitCode = 1;
});
