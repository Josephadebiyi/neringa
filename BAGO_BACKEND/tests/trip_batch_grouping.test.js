import { describe, expect, it } from 'vitest';
import { groupTripsByBatch } from '../controllers/AdminControllers/TripManagement.js';

function trip(overrides) {
  return {
    id: 'trip-default',
    batchId: null,
    userId: 'user-1',
    fromLocation: 'Lagos, Nigeria',
    toLocation: 'Abuja, Nigeria',
    departureDate: '2026-09-01T00:00:00.000Z',
    arrivalDate: '2026-09-01T00:00:00.000Z',
    availableKg: 25,
    status: 'pending_admin_review',
    request: 0,
    soldShipments: [],
    createdAt: '2026-08-20T10:00:00.000Z',
    ...overrides,
  };
}

describe('groupTripsByBatch', () => {
  it('groups same-batch trips into one entry with a correct date count, sorted by departure date', () => {
    const trips = [
      trip({ id: 'a', batchId: 'batch-1', departureDate: '2026-09-03', createdAt: '2026-08-20T10:00:02.000Z' }),
      trip({ id: 'b', batchId: 'batch-1', departureDate: '2026-09-01', createdAt: '2026-08-20T10:00:00.000Z' }),
      trip({ id: 'c', batchId: 'batch-1', departureDate: '2026-09-02', createdAt: '2026-08-20T10:00:01.000Z' }),
    ];

    const [group] = groupTripsByBatch(trips);

    expect(groupTripsByBatch(trips)).toHaveLength(1);
    expect(group.dateCount).toBe(3);
    expect(group.tripIds.sort()).toEqual(['a', 'b', 'c']);
    // Representative fields come from the earliest-departing trip in the batch.
    expect(group.dates.map((d) => d.id)).toEqual(['b', 'c', 'a']);
    expect(group.id).toBe('batch-1');
    expect(group.batchId).toBe('batch-1');
  });

  it('leaves ungrouped (null batchId) trips as their own singleton batch, keyed by their own id', () => {
    const trips = [
      trip({ id: 'solo-1', batchId: null }),
      trip({ id: 'solo-2', batchId: null, createdAt: '2026-08-21T10:00:00.000Z' }),
    ];

    const groups = groupTripsByBatch(trips);
    expect(groups).toHaveLength(2);
    expect(groups.every((g) => g.dateCount === 1)).toBe(true);
    expect(groups.map((g) => g.id).sort()).toEqual(['solo-1', 'solo-2']);
  });

  it('reports status "mixed" when dates in the same batch disagree, and the shared status otherwise', () => {
    const uniform = groupTripsByBatch([
      trip({ id: 'a', batchId: 'batch-2', status: 'active' }),
      trip({ id: 'b', batchId: 'batch-2', status: 'active' }),
    ]);
    expect(uniform[0].status).toBe('active');

    const mixed = groupTripsByBatch([
      trip({ id: 'a', batchId: 'batch-3', status: 'active' }),
      trip({ id: 'b', batchId: 'batch-3', status: 'pending_admin_review' }),
    ]);
    expect(mixed[0].status).toBe('mixed');
  });

  it('never silently drops a date — total dates across all groups equals the input trip count', () => {
    const trips = [
      trip({ id: 'a', batchId: 'batch-4' }),
      trip({ id: 'b', batchId: 'batch-4' }),
      trip({ id: 'c', batchId: null }),
      trip({ id: 'd', batchId: 'batch-5' }),
    ];
    const groups = groupTripsByBatch(trips);
    const totalDates = groups.reduce((sum, g) => sum + g.dateCount, 0);
    expect(totalDates).toBe(trips.length);
  });

  it('orders groups by their earliest createdAt, most recent first', () => {
    const trips = [
      trip({ id: 'old', batchId: null, createdAt: '2026-08-01T00:00:00.000Z' }),
      trip({ id: 'new', batchId: null, createdAt: '2026-08-20T00:00:00.000Z' }),
    ];
    const groups = groupTripsByBatch(trips);
    expect(groups.map((g) => g.id)).toEqual(['new', 'old']);
  });
});
