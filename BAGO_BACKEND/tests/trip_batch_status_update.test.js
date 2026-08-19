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

import { updateTripStatusBatch } from '../controllers/AdminControllers/TripManagement.js';

function mockRes() {
  return {
    statusCode: null,
    body: null,
    status(code) { this.statusCode = code; return this; },
    json(payload) { this.body = payload; return this; },
  };
}

describe('updateTripStatusBatch', () => {
  beforeEach(() => {
    mocks.query.mockReset();
    mocks.queryOne.mockReset();
  });

  it('never reopens dates that already completed or were cancelled — bulk approve must exclude them from the UPDATE', async () => {
    // tripIdsInBatch's lookup
    mocks.query.mockResolvedValueOnce({ rows: [{ id: 'active-date' }, { id: 'completed-date' }] });
    // the actual status UPDATE
    mocks.query.mockResolvedValueOnce({ rows: [] });
    // re-fetch for the response (adminTripSelect)
    mocks.query.mockResolvedValueOnce({ rows: [{ id: 'active-date', status: 'active', batch_id: 'b1', sold_shipments: [] }] });

    const req = { params: { batchId: 'b1' }, body: { status: 'active' } };
    const res = mockRes();

    await updateTripStatusBatch(req, res);

    const updateCall = mocks.query.mock.calls[1];
    const [sql, params] = updateCall;
    expect(sql).toMatch(/update public\.trips/i);
    expect(sql).toMatch(/status not in \('completed', 'cancelled'\)/i);
    expect(params[0]).toBe('active'); // next status
    expect(params[2]).toEqual(['active-date', 'completed-date']); // still scoped to the whole batch — the DB WHERE clause is what protects completed/cancelled rows, not the id list

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('returns 404 when the batch/trip id resolves to nothing', async () => {
    mocks.query.mockResolvedValueOnce({ rows: [] });
    const req = { params: { batchId: 'missing' }, body: { status: 'active' } };
    const res = mockRes();

    await updateTripStatusBatch(req, res);

    expect(res.statusCode).toBe(404);
    expect(res.body.success).toBe(false);
  });

  it('rejects a missing/empty status before touching the database', async () => {
    const req = { params: { batchId: 'b1' }, body: { status: '' } };
    const res = mockRes();

    await updateTripStatusBatch(req, res);

    expect(res.statusCode).toBe(400);
    expect(mocks.query).not.toHaveBeenCalled();
  });
});
