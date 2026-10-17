import {beforeEach, expect, it, vi} from 'vitest';
const m = vi.hoisted(() => ({query: vi.fn()}));
vi.mock('../lib/postgres/db.js', () => ({withTransaction: work => work({query: m.query})}));
import {generateTrackingNumber, ensureTrackingNumber} from '../services/trackingNumber.js';
beforeEach(() => {
  vi.clearAllMocks();
  m.query.mockImplementation(async sql => ({rows: sql.startsWith('select tracking_number') ? [{tracking_number: null}] : []}));
});
it('generates exactly nine characters with both uppercase letters and digits', () => {
  for (let i = 0; i < 100; i++) expect(generateTrackingNumber()).toMatch(/^[A-HJ-NP-Z][A-HJ-NP-Z2-9]{7}[2-9]$/);
});
it('preserves already-issued tracking links and labels', async () => {
  m.query.mockResolvedValue({rows: [{tracking_number: 'BAGO-OLD-LONG-NUMBER'}]});
  expect(await ensureTrackingNumber('shipment')).toBe('BAGO-OLD-LONG-NUMBER');
  expect(m.query).toHaveBeenCalledTimes(1);
});
it('checks and assigns the identifier in the same transaction', async () => {
  const value = await ensureTrackingNumber('shipment');
  expect(m.query.mock.calls[0][0]).toContain('for update');
  expect(m.query.mock.calls[1][1]).toEqual([`tracking:${value}`]);
  expect(m.query.mock.calls.at(-1)[1]).toEqual(['shipment', value]);
});
it('retries a collision instead of assigning a duplicate', async () => {
  let checks = 0;
  m.query.mockImplementation(async sql => {
    if (sql.startsWith('select tracking_number')) return {rows: [{tracking_number: null}]};
    if (sql.includes('where tracking_number =')) return {rows: ++checks === 1 ? [{id: 'another-shipment'}] : []};
    return {rows: []};
  });
  await ensureTrackingNumber('shipment');
  expect(checks).toBe(2);
  expect(m.query.mock.calls.filter(([sql]) => sql.startsWith('update '))).toHaveLength(1);
});
