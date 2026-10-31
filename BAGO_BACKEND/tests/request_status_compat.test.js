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

describe('traveler earning currency', () => {
  const convert = async (amount, from, to) => (from === 'EUR' && to === 'NGN' ? amount * 1700 : amount);

  it('labels the traveler view with the trip (payout) currency', async () => {
    const { forTravelerView } = await import('../services/requestStatusCompat.js');
    const view = await forTravelerView(
      { amount: 60, currency: 'EUR', travelerPayout: 89750, travelerPayoutCurrency: 'NGN', insuranceCost: 2 },
      convert,
    );
    expect(view).toMatchObject({ currency: 'NGN', travelerPayout: 89750, paymentCurrency: 'EUR', paymentAmount: 60, insuranceCost: 3400 });
  });

  it('changes nothing when sender and trip use the same currency', async () => {
    const { forTravelerView } = await import('../services/requestStatusCompat.js');
    const view = await forTravelerView({ currency: 'NGN', travelerPayout: 5000, travelerPayoutCurrency: 'NGN', insuranceCost: 100 }, convert);
    expect(view).toMatchObject({ currency: 'NGN', insuranceCost: 100 });
  });
});
