import { randomInt } from 'node:crypto';
import { withTransaction } from '../lib/postgres/db.js';

const LETTERS = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
const DIGITS = '23456789';
const CHARACTERS = LETTERS + DIGITS;

export function generateTrackingNumber() {
  let value = LETTERS[randomInt(LETTERS.length)];
  for (let i = 0; i < 7; i++) value += CHARACTERS[randomInt(CHARACTERS.length)];
  return value + DIGITS[randomInt(DIGITS.length)];
}

export async function ensureTrackingNumber(requestId, existingClient = null) {
  const assign = async client => {
    const current = await client.query('select tracking_number from public.shipment_requests where id = $1 for update', [requestId]);
    if (!current.rows[0]) throw new Error('Shipment not found for tracking number.');
    if (current.rows[0].tracking_number) return current.rows[0].tracking_number;
    for (let attempt = 0; attempt < 10; attempt++) {
      const value = generateTrackingNumber();
      // Hold the candidate lock until the assignment commits, including when
      // two different shipments happen to draw the same random identifier.
      await client.query('select pg_advisory_xact_lock(hashtextextended($1, 0))', [`tracking:${value}`]);
      const duplicate = await client.query('select id from public.shipment_requests where tracking_number = $1 limit 1', [value]);
      if (duplicate.rows.length) continue;
      await client.query('update public.shipment_requests set tracking_number = $2 where id = $1', [requestId, value]);
      return value;
    }
    throw new Error('A unique tracking number could not be assigned. Please retry.');
  };
  return existingClient ? assign(existingClient) : withTransaction(assign);
}
