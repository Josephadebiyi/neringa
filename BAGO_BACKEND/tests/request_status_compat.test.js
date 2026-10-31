import { describe, expect, it } from 'vitest';
import { clientRequestStatus, withClientStatus } from '../services/requestStatusCompat.js';

describe('request status shown to mobile apps', () => {
  it('shows inspection stages as accepted so travelers get the status buttons', () => {
    for (const s of ['accepted_awaiting_inspection', 'inspection_in_progress', 'inspection_completed', 'approved_for_trip']) {
      expect(clientRequestStatus(s)).toBe('accepted');
    }
  });

  it('leaves every other status alone', () => {
    for (const s of ['pending', 'accepted', 'intransit', 'delivering', 'completed', 'rejected', 'cancelled', 'rejected_at_inspection_under_review']) {
      expect(clientRequestStatus(s)).toBe(s);
    }
  });

  it('keeps the real status in workflowStatus', () => {
    expect(withClientStatus({ id: 1, status: 'accepted_awaiting_inspection' }))
      .toEqual({ id: 1, status: 'accepted', workflowStatus: 'accepted_awaiting_inspection' });
  });
});

describe('traveler view', () => {
  const convert = async (amount, from, to) => (from === 'EUR' && to === 'NGN' ? amount * 1700 : amount);

  it('shows the earning in the traveler wallet currency', async () => {
    const { forTravelerView } = await import('../services/requestStatusCompat.js');
    const view = await forTravelerView(
      { amount: 60, currency: 'EUR', travelerPayout: 89750, insuranceCost: 2 },
      { earning: { amount: 86956.52, currency: 'NGN' }, convert },
    );
    expect(view).toMatchObject({
      currency: 'NGN', travelerPayout: 86956.52, travelerPayoutCurrency: 'NGN',
      paymentCurrency: 'EUR', paymentAmount: 60, insuranceCost: 3400,
    });
  });

  it('leaves the request alone when no earning is known', async () => {
    const { forTravelerView } = await import('../services/requestStatusCompat.js');
    const view = await forTravelerView({ currency: 'NGN', travelerPayout: 5000 }, { earning: null, convert });
    expect(view).toMatchObject({ currency: 'NGN', travelerPayout: 5000 });
  });
});
