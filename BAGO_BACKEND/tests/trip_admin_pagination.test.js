import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  query: vi.fn(),
  queryOne: vi.fn(),
}));

vi.mock('../lib/postgres/db.js', () => ({
  query: mocks.query,
  queryOne: mocks.queryOne,
}));
vi.mock('../services/pushNotificationService.js', () => ({
  sendPushNotification: vi.fn().mockResolvedValue([]),
}));
vi.mock('../services/emailNotifications.js', () => ({
  sendTripApprovedEmail: vi.fn().mockResolvedValue(true),
  sendTripDeclinedEmail: vi.fn().mockResolvedValue(true),
}));
vi.mock('../lib/postgres/trips.js', () => ({
  updateTripRecord: vi.fn(),
  ensureTripBatchColumn: vi.fn().mockResolvedValue(undefined),
}));

import { getAllTrips } from '../controllers/AdminControllers/TripManagement.js';

function mockRes() {
  return {
    statusCode: null,
    body: null,
    status(code) { this.statusCode = code; return this; },
    json(payload) { this.body = payload; return this; },
  };
}

function row(overrides) {
  return {
    id: 'row-default',
    trip_number: '0001',
    batch_id: null,
    user_id: 'user-default',
    first_name: 'Jane',
    last_name: 'Doe',
    email: 'jane@example.com',
    phone: null,
    account_type: 'individual',
    company_name: null,
    trading_name: null,
    from_location: 'Lagos, Nigeria',
    from_country: 'Nigeria',
    to_location: 'Abuja, Nigeria',
    to_country: 'Nigeria',
    departure_date: '2026-09-01T00:00:00.000Z',
    arrival_date: '2026-09-01T00:00:00.000Z',
    available_kg: 25,
    travel_means: 'airplane',
    status: 'active',
    request_count: 0,
    price_per_kg: 10,
    currency: 'NGN',
    landmark: null,
    travel_document_url: null,
    travel_document_verified: true,
    collection_city: null,
    collection_country: null,
    created_at: '2026-08-20T10:00:00.000Z',
    updated_at: '2026-08-20T10:00:00.000Z',
    sold_shipments: [],
    ...overrides,
  };
}

describe('getAllTrips pagination', () => {
  beforeEach(() => {
    mocks.query.mockReset();
    mocks.queryOne.mockReset();
  });

  it('groups rows before paginating, so one busy posting cannot push other users off page 1', async () => {
    // One business posts 5 dates in a single batch — all the most recent rows.
    const batchRows = Array.from({ length: 5 }, (_, i) =>
      row({
        id: `batch-row-${i}`,
        batch_id: 'batch-1',
        user_id: 'business-1',
        account_type: 'company',
        company_name: 'ETKT Global',
        created_at: new Date(Date.UTC(2026, 7, 20, 10, 0, 4 - i)).toISOString(),
      }));

    // 20 other users each posted one standalone trip, older than the batch
    // but still well within what should fit on page 1 alongside it.
    const singletonRows = Array.from({ length: 20 }, (_, i) =>
      row({
        id: `single-${i}`,
        user_id: `user-${i}`,
        created_at: new Date(Date.UTC(2026, 7, 20, 9, 59, 59 - i)).toISOString(),
      }));

    // Raw rows ordered created_at desc, exactly as the SQL would return them.
    mocks.query.mockResolvedValueOnce({ rows: [...batchRows, ...singletonRows] });

    const req = { query: { page: '1', limit: '20' } };
    const res = mockRes();
    await getAllTrips(req, res);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    // 1 grouped batch entry + 20 standalone entries = 21 groups; page 1 of 20
    // must show 20 of them, not silently drop users because their raw rows
    // fell outside a pre-grouping row-count limit.
    expect(res.body.totalCount).toBe(21);
    expect(res.body.data).toHaveLength(20);
    expect(res.body.data.some((g) => g.batchId === 'batch-1')).toBe(true);
    // Only the single oldest posting should be deferred to page 2.
    const shownIds = res.body.data.map((g) => g.id);
    expect(shownIds).toContain('single-18');
    expect(shownIds).not.toContain('single-19');
  });
});
