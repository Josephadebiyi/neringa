import {beforeEach, afterEach, describe, expect, it, vi} from 'vitest';
const m = vi.hoisted(() => ({query: vi.fn(), queryOne: vi.fn(), quote: vi.fn(), create: vi.fn(), retrieve: vi.fn(), signature: vi.fn()}));
vi.mock('../lib/postgres/db.js', () => ({query: m.query, queryOne: m.queryOne, withTransaction: vi.fn()}));
vi.mock('../controllers/SenderOnboardingController.js', () => ({checkTermsAccepted: vi.fn().mockResolvedValue(true)}));
vi.mock('../lib/postgres/tripCapacity.js', () => ({buildTripCapacitySnapshot: vi.fn().mockResolvedValue({availableKg: 20})}));
vi.mock('../controllers/CurrencyController.js', () => ({buildShipmentCheckoutPreview: m.quote}));
vi.mock('../services/resendClient.js', () => ({resend: null}));
vi.mock('../services/ipGeolocation.js', () => ({getClientIP: () => '127.0.0.1', getLocationFromIP: vi.fn().mockResolvedValue(null)}));
vi.mock('../services/emailNotifications.js', () => ({sendWithdrawalProcessedEmail: vi.fn(), sendWithdrawalSubmittedEmail: vi.fn()}));
vi.mock('stripe', () => ({default: class Stripe {
  paymentIntents = {create: m.create, retrieve: m.retrieve};
  ephemeralKeys = {create: async () => ({secret: 'test_ephemeral'})};
  webhooks = {constructEvent: m.signature};
}}));
import {createStripePaymentIntent, isStripeCheckoutEnabled, stripeConnectWebhook} from '../controllers/StripeController.js';
const quote = {travelerCurrency: 'USD', senderCurrency: 'EUR', travelerPayout: 100,
  convertedTravelerPayout: 92, platformFee: 13.8, processingFee: 2, fxBuffer: 0,
  shippingAmount: 107.8, insuranceAmount: 5, totalAmount: 112.8, bagoNetRevenue: 15.8, exchangeRate: .92};
function res() {return {code: 200, status(code) {this.code = code; return this;}, json(data) {this.data = data; return this;}, send(data) {this.data = data; return this;}};}
function req(amount = 112.8) {return {user: {id: 'sender'}, body: {amount, currency: 'EUR', packageId: 'pkg', tripId: 'trip', travelerId: 'traveler', termsAccepted: true, insurance: true}};}
beforeEach(() => {
  vi.clearAllMocks();
  vi.stubEnv('STRIPE_SECRET_KEY', 'sk_test_mockonly'); vi.stubEnv('STRIPE_PUBLISHABLE_KEY', 'pk_test_mockonly'); vi.stubEnv('STRIPE_CHECKOUT_ENABLED', 'true');
  vi.stubEnv('STRIPE_WEBHOOK_SECRET', 'whsec_mockonly');
  m.query.mockResolvedValue({rows: []});
  m.queryOne.mockImplementation(async sql => sql.includes('select p.*') ? {id: 'sender', preferred_currency: 'EUR', phone_verified: true, stripe_customer_id: 'cus_test'} : {id: 'pkg', package_weight: 2, declared_value: 50});
  m.quote.mockResolvedValue(quote);
  m.create.mockResolvedValue({id: 'pi_mock', status: 'requires_payment_method', client_secret: 'pi_mock_secret_test'});
});
afterEach(() => vi.unstubAllEnvs());
describe('Stripe card and Apple Pay initialization', () => {
  it('charges the complete converted price with commission and insurance', async () => {
    const response = res(); await createStripePaymentIntent(req(), response);
    expect(response.code).toBe(200);
    expect(m.quote).toHaveBeenCalledWith(expect.objectContaining({insurance: true, senderCurrency: 'EUR'}));
    expect(m.create).toHaveBeenCalledWith(expect.objectContaining({amount: 11280, currency: 'eur', metadata: expect.objectContaining({bago_commission: '13.8'})}), expect.objectContaining({idempotencyKey: expect.any(String)}));
    expect(response.data.paymentStatus).toBe('requires_payment_method');
  });
  it('blocks a price that omits commission before charging', async () => {
    const response = res(); await createStripePaymentIntent(req(99), response);
    expect(response.code).toBe(409); expect(response.data.code).toBe('CHECKOUT_PRICE_CHANGED'); expect(m.create).not.toHaveBeenCalled();
  });
  it('uses one idempotency key across retries', async () => {
    await createStripePaymentIntent(req(), res()); await createStripePaymentIntent(req(), res());
    expect(m.create.mock.calls[0][1].idempotencyKey).toBe(m.create.mock.calls[1][1].idempotencyKey);
  });
  it('recovers a captured payment before an FX change can open another charge', async () => {
    const fallback = m.queryOne.getMockImplementation();
    m.queryOne.mockImplementation(async sql => sql.includes('select stripe_payment_intent_id')
      ? {stripe_payment_intent_id: 'pi_previous'} : fallback(sql));
    m.retrieve.mockResolvedValue({id: 'pi_previous', client_secret: 'pi_previous_secret', status: 'succeeded',
      metadata: {senderId: 'sender', packageId: 'pkg', tripId: 'trip', travelerId: 'traveler'}});
    const response = res(); await createStripePaymentIntent(req(120), response);
    expect(response.data.recovered).toBe(true); expect(m.create).not.toHaveBeenCalled(); expect(m.quote).not.toHaveBeenCalled();
  });
  it('does not charge a sender with an unverified phone', async () => {
    m.queryOne.mockResolvedValue({id: 'sender', preferred_currency: 'EUR', phone_verified: null});
    const response = res(); await createStripePaymentIntent(req(), response);
    expect(response.code).toBe(403); expect(m.create).not.toHaveBeenCalled();
  });
  it('rejects a charge without the booking it must create', async () => {
    const response = res(); await createStripePaymentIntent({user: {id: 'sender'}, body: {amount: 100, currency: 'EUR'}}, response);
    expect(response.code).toBe(400); expect(m.create).not.toHaveBeenCalled();
  });
  it('rejects mismatched test/live keys and respects the disable switch', () => {
    expect(isStripeCheckoutEnabled()).toBe(true); vi.stubEnv('STRIPE_PUBLISHABLE_KEY', 'pk_live_mockonly'); expect(isStripeCheckoutEnabled()).toBe(false);
    vi.stubEnv('STRIPE_PUBLISHABLE_KEY', 'pk_test_mockonly'); vi.stubEnv('STRIPE_CHECKOUT_ENABLED', 'false'); expect(isStripeCheckoutEnabled()).toBe(false);
  });
  it('keeps new checkout disabled without the signed webhook needed for recovery', () => {
    vi.stubEnv('STRIPE_WEBHOOK_SECRET', ''); expect(isStripeCheckoutEnabled()).toBe(false);
  });
  it('rejects invalid webhook signatures', async () => {
    m.signature.mockImplementation(() => {throw new Error('Invalid signature');});
    const response = res(); await stripeConnectWebhook({headers: {'stripe-signature': 'invalid'}, rawBody: Buffer.from('{}')}, response);
    expect(response.code).toBe(400); expect(m.retrieve).not.toHaveBeenCalled();
  });
});

describe('Stripe webhook payment ownership', () => {
  async function webhook(metadata = {senderId: 'sender'}) {
    m.signature.mockReturnValue({id: 'evt_processing', type: 'payment_intent.processing', data: {object: {id: 'pi_mock'}}});
    m.retrieve.mockResolvedValue({id: 'pi_mock', status: 'processing', amount: 11280, currency: 'eur', metadata});
    const response = res();
    await stripeConnectWebhook({headers: {'stripe-signature': 'signed'}, rawBody: Buffer.from('{}')}, response);
    return response;
  }
  it('supplies a non-null owner even when the payment already exists', async () => {
    m.query.mockImplementation(async (sql, params) => {
      if (sql.includes('insert into public.payments')) {
        if (!sql.includes('$7') || !params[6]) throw new Error('user_id violates not-null constraint');
      }
      return {rows: []};
    });
    const response = await webhook();
    expect(response.code).toBe(200);
    const paymentWrite = m.query.mock.calls.find(([sql]) => sql.includes('insert into public.payments'));
    expect(paymentWrite[1][6]).toBe('sender');
  });
  it('recovers the ledger owner for older intents without sender metadata', async () => {
    m.queryOne.mockResolvedValue({user_id: 'recorded-sender'});
    const response = await webhook({});
    expect(response.code).toBe(200);
    expect(m.query.mock.calls.find(([sql]) => sql.includes('insert into public.payments'))[1][6]).toBe('recorded-sender');
  });
  it('returns an error for a failed payment write so Stripe retries delivery', async () => {
    m.query.mockImplementation(async sql => {
      if (sql.includes('insert into public.payments')) throw new Error('Database unavailable');
      return {rows: []};
    });
    const response = await webhook();
    expect(response.code).toBe(500);
  });
});

it('additional weight creates its own intent using the trip quote, not an original captured payment', async () => {
  m.queryOne.mockImplementation(async sql => {
    if (sql.includes('select p.*')) return {id: 'sender', preferred_currency: 'EUR', phone_verified: true, stripe_customer_id: 'cus_test'};
    if (sql.includes('select sr.*')) return {id: 'request', package_id: 'pkg', trip_id: 'trip', currency: 'EUR', status: 'accepted_awaiting_inspection', package_weight: 2};
    if (sql.includes('select stripe_payment_intent_id')) return {stripe_payment_intent_id: 'pi_original'};
    return {id: 'pkg', package_weight: 2, declared_value: 50};
  });
  m.quote.mockResolvedValue({...quote, tripId: 'trip', travelerId: 'traveler'});
  const request = req(); request.body.requestId = 'request'; request.body.additionalKg = 3;
  const response = res(); await createStripePaymentIntent(request, response);
  expect(response.code).toBe(200);
  expect(m.retrieve).not.toHaveBeenCalled();
  expect(m.quote).toHaveBeenCalledWith(expect.objectContaining({weight: 3, insurance: false}));
  expect(m.create.mock.calls[0][0].metadata).toMatchObject({additionalRequestId: 'request', additionalKg: '3', baseWeight: '2'});
});
