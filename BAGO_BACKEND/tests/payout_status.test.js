import { describe, it, expect } from 'vitest';

// Extracted from lib/postgres/trips.js normalizeTripRow — testing the SQL CASE output logic
function derivePayoutStatus({ completedBookingCount, activeShipmentCount }) {
  if (completedBookingCount > 0 && activeShipmentCount === 0) return 'paid';
  if (completedBookingCount > 0) return 'partially_paid';
  if (activeShipmentCount > 0) return 'pending';
  return 'pending';
}

// Frontend label formatter (mirrors Flutter + web formatPayoutStatus)
function formatPayoutStatus(raw) {
  switch ((raw || '').trim().toLowerCase()) {
    case 'paid': return 'Paid out';
    case 'partially_paid': return 'Partially paid';
    case 'pending': return 'Pending';
    default: return raw || 'Pending';
  }
}

describe('payout_status SQL logic', () => {
  it('returns "paid" when all shipments completed and none active', () => {
    expect(derivePayoutStatus({ completedBookingCount: 3, activeShipmentCount: 0 })).toBe('paid');
  });

  it('returns "partially_paid" when some completed but some still active', () => {
    expect(derivePayoutStatus({ completedBookingCount: 2, activeShipmentCount: 1 })).toBe('partially_paid');
  });

  it('returns "pending" when no completions yet but active shipments exist', () => {
    expect(derivePayoutStatus({ completedBookingCount: 0, activeShipmentCount: 2 })).toBe('pending');
  });

  it('returns "pending" for brand new trip with zero bookings', () => {
    expect(derivePayoutStatus({ completedBookingCount: 0, activeShipmentCount: 0 })).toBe('pending');
  });
});

describe('formatPayoutStatus labels', () => {
  it('formats "paid" → "Paid out"', () => {
    expect(formatPayoutStatus('paid')).toBe('Paid out');
  });

  it('formats "partially_paid" → "Partially paid"', () => {
    expect(formatPayoutStatus('partially_paid')).toBe('Partially paid');
  });

  it('formats "pending" → "Pending"', () => {
    expect(formatPayoutStatus('pending')).toBe('Pending');
  });

  it('handles empty string gracefully', () => {
    expect(formatPayoutStatus('')).toBe('Pending');
  });

  it('handles undefined gracefully', () => {
    expect(formatPayoutStatus(undefined)).toBe('Pending');
  });

  it('is case-insensitive for raw values', () => {
    expect(formatPayoutStatus('PAID')).toBe('Paid out');
    expect(formatPayoutStatus('Partially_Paid')).toBe('Partially paid');
  });
});
