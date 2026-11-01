/**
 * READ-ONLY report: traveler escrow holds whose amount is in the wrong
 * currency.
 *
 * Bookings paid before the 2026-10-31 earnings fix could record the
 * traveler's earning in the sender's payment currency but label it with the
 * traveler's wallet currency (e.g. EUR 68.79 stored as "NGN 68.79"). When such
 * a booking is released the traveler is credited that wrong figure.
 *
 * This script changes nothing. It lists each affected booking with what was
 * held, what should have been held, and whether it has already been released,
 * so an admin can decide on corrections.
 *
 *   node scripts/findMislabelledEscrowHolds.js            # table output
 *   node scripts/findMislabelledEscrowHolds.js --csv      # CSV output
 */
import dotenv from 'dotenv';

import { query } from '../lib/postgres/db.js';
import { isCurrencyScaleMismatch } from '../lib/postgres/accounts.js';
import { convertCurrency } from '../services/currencyConverter.js';
import { feesFrom, travelerEarningIn } from '../services/travelerEarnings.js';

dotenv.config();

const CSV = process.argv.includes('--csv');

const { rows } = await query(`
  select sr.id as request_id,
         sr.tracking_number,
         sr.status as request_status,
         sr.traveler_id,
         trim(coalesce(p.first_name, '') || ' ' || coalesce(p.last_name, '')) as traveler_name,
         sr.amount,
         sr.currency,
         sr.insurance_cost,
         sr.platform_commission,
         sr.processing_fee,
         sr.fx_buffer,
         holds.held_amount,
         holds.held_currency,
         holds.first_held_at,
         exists (
           select 1 from public.wallet_transactions rel
           where rel.request_id = sr.id and rel.user_id = sr.traveler_id
             and rel.type::text in ('escrow_release', 'earning')
             and rel.status = 'completed'
         ) as released
  from public.shipment_requests sr
  join lateral (
    select sum(wt.amount)::numeric as held_amount,
           max(wt.currency) as held_currency,
           min(wt.created_at) as first_held_at
    from public.wallet_transactions wt
    where wt.request_id = sr.id and wt.user_id = sr.traveler_id
      and wt.type = 'escrow_hold' and wt.status = 'completed'
  ) holds on holds.held_amount > 0
  left join public.profiles p on p.id = sr.traveler_id
  order by holds.first_held_at desc
`);

const affected = [];
for (const row of rows) {
  const heldCurrency = String(row.held_currency || '').toUpperCase();
  let expected;
  try {
    expected = await travelerEarningIn({
      amountPaid: row.amount,
      insuranceCost: row.insurance_cost,
      fees: feesFrom(row),
      paymentCurrency: row.currency,
      toCurrency: heldCurrency,
      convert: convertCurrency,
    });
  } catch (error) {
    console.warn(`Skipping ${row.request_id}: could not convert ${row.currency} -> ${heldCurrency} (${error.message})`);
    continue;
  }
  const held = Number(Number(row.held_amount).toFixed(2));
  if (!isCurrencyScaleMismatch(held, expected.amount)) continue;
  affected.push({
    request_id: row.request_id,
    tracking_number: row.tracking_number || '',
    traveler_id: row.traveler_id,
    traveler_name: row.traveler_name,
    paid: `${row.currency} ${Number(row.amount).toFixed(2)}`,
    held: `${heldCurrency} ${held.toFixed(2)}`,
    should_be: `${heldCurrency} ${expected.amount.toFixed(2)}`,
    shortfall: `${heldCurrency} ${(expected.amount - held).toFixed(2)}`,
    request_status: row.request_status,
    already_released: row.released ? 'yes' : 'no',
    held_at: row.first_held_at ? new Date(row.first_held_at).toISOString() : '',
  });
}

if (CSV) {
  const headers = Object.keys(affected[0] || { request_id: '' });
  console.log(headers.join(','));
  for (const item of affected) {
    console.log(headers.map((h) => `"${String(item[h]).replace(/"/g, '""')}"`).join(','));
  }
} else {
  console.log(`Checked ${rows.length} escrow-held bookings; ${affected.length} held in the wrong currency.`);
  if (affected.length) console.table(affected);
}
process.exit(0);
