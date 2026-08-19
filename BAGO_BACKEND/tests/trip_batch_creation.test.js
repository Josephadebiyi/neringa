import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  query: vi.fn().mockResolvedValue({ rows: [], rowCount: 0 }),
  queryOne: vi.fn(),
}));

vi.mock('../lib/postgres/db.js', () => ({
  query: mocks.query,
  queryOne: mocks.queryOne,
  withTransaction: async (work) => work({ query: mocks.query, release: vi.fn() }),
}));

import { createTripRecord } from '../lib/postgres/trips.js';

describe('createTripRecord', () => {
  beforeEach(() => {
    mocks.query.mockClear();
    mocks.queryOne.mockReset();
    mocks.queryOne.mockImplementation((sql) => {
      if (sql.includes('nextval')) return Promise.resolve({ trip_number: '0001' });
      if (sql.includes('insert into public.trips')) return Promise.resolve({ id: 'trip-uuid-1' });
      return Promise.resolve(null);
    });
  });

  const baseArgs = {
    userId: 'user-1',
    fromLocation: 'Lagos, Nigeria',
    fromCountry: 'Nigeria',
    toLocation: 'Abuja, Nigeria',
    toCountry: 'Nigeria',
    departureDate: new Date('2026-09-01'),
    arrivalDate: new Date('2026-09-01'),
    availableKg: 25,
    travelMeans: 'airplane',
    pricePerKg: 10,
    currency: 'NGN',
    landmark: 'Near the mall',
    travelDocument: null,
  };

  function findInsertCall() {
    const call = mocks.queryOne.mock.calls.find(([sql]) => sql.includes('insert into public.trips'));
    if (!call) throw new Error('createTripRecord never issued the trips INSERT');
    return call;
  }

  it('binds every SQL placeholder to the correct positional value (no off-by-one)', async () => {
    await createTripRecord({ ...baseArgs, proofExempt: false, batchId: 'batch-uuid-1' });

    const [sql, params] = findInsertCall();

    // Column list and placeholder list must have the same arity, and each
    // named column must resolve to the value that was actually intended for
    // it — this is exactly the class of bug (a shifted placeholder after
    // adding batch_id) that slipped through in an earlier manual edit.
    expect(params[0]).toBe('user-1');           // user_id
    expect(params[1]).toBe('0001');              // trip_number
    expect(params[2]).toBe('batch-uuid-1');       // batch_id
    expect(params[3]).toBe('Lagos, Nigeria');     // from_location
    expect(params[4]).toBe('Nigeria');            // from_country
    expect(params[5]).toBe('Abuja, Nigeria');     // to_location
    expect(params[6]).toBe('Nigeria');            // to_country
    expect(params[7]).toBe(null);                 // collection_city
    expect(params[8]).toBe(null);                 // collection_country
    expect(params[9]).toEqual(baseArgs.departureDate);  // departure_date
    expect(params[10]).toEqual(baseArgs.arrivalDate);   // arrival_date
    expect(params[11]).toBe(25);                  // available_kg (bound once, used for both total_kg and available_kg)
    expect(params[12]).toBe('airplane');          // travel_means
    expect(params[13]).toBe(10);                  // price_per_kg
    expect(params[14]).toBe('NGN');               // currency
    expect(params[15]).toBe('Near the mall');     // landmark
    expect(params[16]).toBe(null);                // travel_document_url
    expect(params[17]).toBe(null);                // travel_document_uploaded_at (no document uploaded)
    expect(params[18]).toBe(false);                // travel_document_verified = proofExempt
    expect(params[19]).toBe('pending_admin_review'); // status — always review, even for proofExempt accounts
    expect(params).toHaveLength(20);

    // total_kg and available_kg columns must reuse the *same* placeholder
    // ($12 for both), not two different (and therefore possibly wrong) ones.
    const valuesClause = sql.match(/values\s*\(([^)]+)\)/i)[1];
    const placeholders = valuesClause.split(',').map((p) => p.trim());
    expect(placeholders[11]).toBe('$12'); // total_kg
    expect(placeholders[12]).toBe('$12'); // available_kg — same param as total_kg
  });

  it('sets status to pending_admin_review even for proof-exempt (business) accounts', async () => {
    await createTripRecord({ ...baseArgs, proofExempt: true });
    const [, params] = findInsertCall();
    expect(params[18]).toBe(true);                   // travel_document_verified still reflects proofExempt
    expect(params[19]).toBe('pending_admin_review');  // but status is never auto-active anymore
  });

  it('stores a null batch_id when none is provided (single ad-hoc trip)', async () => {
    await createTripRecord({ ...baseArgs, proofExempt: false });
    const [, params] = findInsertCall();
    expect(params[2]).toBe(null);
  });

  it('marks the uploaded_at column set only when a travel document is actually provided', async () => {
    await createTripRecord({ ...baseArgs, proofExempt: false, travelDocument: 'https://example.com/doc.jpg' });
    const [, params] = findInsertCall();
    expect(params[16]).toBe('https://example.com/doc.jpg');
    expect(params[17]).toEqual(baseArgs.departureDate);
  });
});
