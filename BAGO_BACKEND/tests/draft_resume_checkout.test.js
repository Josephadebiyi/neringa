import { describe, expect, it, vi } from 'vitest';

vi.mock('../lib/postgres/db.js', () => ({ query: vi.fn(), queryOne: vi.fn(), withTransaction: vi.fn() }));

import { draftResumeCheckout } from '../lib/postgres/shipping.js';

const parse = (url) => Object.fromEntries(new URL(url, 'https://bago.test').searchParams);

describe('Continue Payment on unpaid drafts', () => {
  it('resumes from the checkout remembered when any payment started', () => {
    const resume = draftResumeCheckout({
      id: 'pkg-1', currency: 'EUR',
      checkout_context: { tripId: 'trip-1', travelerId: 'trav-1', amount: 67.93, currency: 'eur', insurance: true, insuranceCost: 5 },
    });
    expect(resume.url.startsWith('/checkout/payment?')).toBe(true);
    expect(parse(resume.url)).toEqual({
      packageId: 'pkg-1', tripId: 'trip-1', travelerId: 'trav-1', amount: '67.93',
      currency: 'EUR', insurance: 'true', insuranceCost: '5',
    });
  });

  it('still resumes older Flutterwave drafts, now with the traveller the checkout page needs', () => {
    const resume = draftResumeCheckout({
      id: 'pkg-2', currency: 'NGN', flutterwave_amount: '45000', flutterwave_currency: 'NGN',
      flutterwave_traveler_id: 'trav-2', flutterwave_raw_response: { tripId: 'trip-2' },
    });
    expect(parse(resume.url)).toMatchObject({ packageId: 'pkg-2', tripId: 'trip-2', travelerId: 'trav-2', amount: '45000.00', currency: 'NGN', insurance: 'false' });
  });

  it('returns nothing for a draft that never reached payment', () => {
    expect(draftResumeCheckout({ id: 'pkg-3', currency: 'EUR' })).toBeNull();
  });
});
