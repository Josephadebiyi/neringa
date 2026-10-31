import { describe, expect, it, vi } from 'vitest';

vi.mock('../lib/postgres/db.js', () => ({ query: vi.fn(), queryOne: vi.fn(), withTransaction: vi.fn() }));

const { isPackageInspectionComplete } = await import('../lib/postgres/shipping.js');

const signed = { inspectionConfirmed: true, safetyConfirmed: true, responsibilityAccepted: true };

describe('package inspection clears the trip without sender photos', () => {
  it('approves when the traveler uploaded 2-4 photos and signed', () => {
    expect(isPackageInspectionComplete({ ...signed, travelerPhotos: ['a', 'b'] })).toBe(true);
    expect(isPackageInspectionComplete({ ...signed, travelerPhotos: ['a', 'b', 'c', 'd'] })).toBe(true);
  });

  it('does not need sender photos', () => {
    expect(isPackageInspectionComplete({ ...signed, travelerPhotos: ['a', 'b'], senderPhotos: [] })).toBe(true);
  });

  it('still requires traveler photos and every confirmation', () => {
    expect(isPackageInspectionComplete({ ...signed, travelerPhotos: ['a'] })).toBe(false);
    expect(isPackageInspectionComplete({ ...signed, travelerPhotos: ['a', 'b', 'c', 'd', 'e'] })).toBe(false);
    expect(isPackageInspectionComplete({ ...signed, safetyConfirmed: false, travelerPhotos: ['a', 'b'] })).toBe(false);
    expect(isPackageInspectionComplete({})).toBe(false);
  });
});
