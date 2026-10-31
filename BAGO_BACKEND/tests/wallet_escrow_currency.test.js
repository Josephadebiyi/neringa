import {beforeEach, describe, expect, it, vi} from 'vitest';
const m = vi.hoisted(() => ({query: vi.fn(), convert: vi.fn()}));
vi.mock('../lib/postgres/db.js', () => ({query: vi.fn(), queryOne: vi.fn(), withTransaction: async fn => fn({query: m.query})}));
vi.mock('../lib/postgres/profiles.js', () => ({findProfileById: vi.fn(), getWalletByUserId: vi.fn()}));
vi.mock('../services/currencyConverter.js', () => ({convertCurrency: m.convert}));
vi.mock('../services/pricingService.js', () => ({getFullPricingConfig: vi.fn()}));
import {holdEscrowForPaidRequest} from '../lib/postgres/accounts.js';
let walletCurrency;
beforeEach(() => {
  vi.clearAllMocks(); walletCurrency = 'EUR'; m.convert.mockResolvedValue(92);
  m.query.mockImplementation(async sql => {
    if (sql.includes('left join public.trips') && !/for update of sr\b/i.test(sql)) throw new Error('FOR UPDATE cannot be applied to the nullable side of an outer join');
    if (sql.includes('from public.shipment_requests sr')) return {rows: [{id: 'request', sender_id: 'sender', traveler_id: 'traveler', trip_id: 'trip', amount: 175000, currency: 'NGN', trip_currency: 'USD', traveler_payout: 100, insurance_cost: 0, platform_commission: 22500, processing_fee: 2500, fx_buffer: 0}]};
    if (sql.includes('insert into public.payment_events')) return {rows: [{id: 1}]};
    if (sql.includes('select id, currency from public.wallet_accounts')) return {rows: [{id: 'wallet', currency: walletCurrency}]};
    return {rows: []};
  });
});
describe('traveler wallet currency after Stripe payment', () => {
  // Sender paid NGN 175,000; Bago charged NGN 22,500 commission + NGN 2,500 processing.
  // Traveler earns NGN 150,000, converted from the payment currency into the wallet currency.
  it('credits what was paid minus fees, converted from the payment currency', async () => {
    await holdEscrowForPaidRequest({requestId: 'request', providerReference: 'pi_paid', provider: 'stripe'});
    expect(m.convert).toHaveBeenCalledExactlyOnceWith(150000, 'NGN', 'EUR');
    expect(m.query.mock.calls.find(([sql]) => sql.includes('set escrow_balance = escrow_balance +'))[1]).toEqual(['traveler', 92]);
  });
  it('does not convert when the wallet is in the payment currency', async () => {
    walletCurrency = 'NGN'; await holdEscrowForPaidRequest({requestId: 'request', providerReference: 'pi_paid', provider: 'stripe'});
    expect(m.convert).not.toHaveBeenCalled();
    expect(m.query.mock.calls.find(([sql]) => sql.includes('set escrow_balance = escrow_balance +'))[1]).toEqual(['traveler', 150000]);
  });
});
