import {beforeEach, afterEach, describe, expect, it, vi} from 'vitest';
const m = vi.hoisted(() => ({query: vi.fn(), queryOne: vi.fn(), quote: vi.fn(), create: vi.fn(), retrieve: vi.fn(), signature: vi.fn(), session: vi.fn(), bookable: vi.fn()}));
vi.mock('../lib/postgres/db.js', () => ({query: m.query, queryOne: m.queryOne, withTransaction: vi.fn()}));
vi.mock('../controllers/SenderOnboardingController.js', () => ({checkTermsAccepted: vi.fn().mockResolvedValue(true)}));
vi.mock('../lib/postgres/tripCapacity.js', () => ({buildTripCapacitySnapshot: vi.fn().mockResolvedValue({availableKg: 20})}));
vi.mock('../controllers/CurrencyController.js', () => ({buildShipmentCheckoutPreview: m.quote}));
vi.mock('../services/tripBookability.js', () => ({tripBookingProblem: m.bookable}));
vi.mock('../services/resendClient.js', () => ({resend: null}));
vi.mock('../services/ipGeolocation.js', () => ({getClientIP: () => '127.0.0.1', getLocationFromIP: vi.fn().mockResolvedValue(null)}));
vi.mock('../services/emailNotifications.js', () => ({sendWithdrawalProcessedEmail: vi.fn(), sendWithdrawalSubmittedEmail: vi.fn()}));
vi.mock('stripe', () => ({default: class Stripe {
  paymentIntents = {create: m.create, retrieve: m.retrieve};
  ephemeralKeys = {create: async () => ({secret: 'test_ephemeral'})};
  webhooks = {constructEvent: m.signature};
  checkout = {sessions: {create: m.session}};
}}));
import {bizumReturnPage, createBizumCheckoutSession, createStripePaymentIntent, createStripeWebCheckoutSession, getBizumEligibility, isStripeCheckoutEnabled, stripeConnectWebhook} from '../controllers/StripeController.js';
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
  m.bookable.mockResolvedValue(null);
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
  it('keeps redirect wallets out of the card sheet for app builds without a return URL', async () => {
    await createStripePaymentIntent(req(), res());
    expect(m.create.mock.calls[0][0].automatic_payment_methods).toEqual({enabled: true, allow_redirects: 'never'});
  });
  it('offers redirect wallets like Revolut Pay to app builds that support them', async () => {
    await createStripePaymentIntent({...req(), body: {...req().body, supportsRedirects: true}}, res());
    expect(m.create.mock.calls[0][0].automatic_payment_methods).toEqual({enabled: true, allow_redirects: 'always'});
  });
  it('refuses to charge for a trip that can no longer take the package', async () => {
    m.bookable.mockResolvedValue({status: 409, body: {success: false, code: 'TRIP_NOT_BOOKABLE', message: 'This trip is no longer available for booking.'}});
    const response = res(); await createStripePaymentIntent(req(), response);
    expect(response.code).toBe(409); expect(response.data.code).toBe('TRIP_NOT_BOOKABLE'); expect(m.create).not.toHaveBeenCalled();
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
  it('does not charge a sender with an unverified phone when the phone check is on', async () => {
    vi.stubEnv('REQUIRE_PHONE_FOR_CARD_CHECKOUT', 'true');
    m.queryOne.mockResolvedValue({id: 'sender', preferred_currency: 'EUR', phone_verified: null});
    const response = res(); await createStripePaymentIntent(req(), response);
    expect(response.code).toBe(403); expect(m.create).not.toHaveBeenCalled();
  });
  it('lets a sender with an unverified phone pay by default', async () => {
    const fallback = m.queryOne.getMockImplementation();
    m.queryOne.mockImplementation(async sql => sql.includes('select p.*')
      ? {id: 'sender', preferred_currency: 'EUR', phone_verified: null, stripe_customer_id: 'cus_test'} : fallback(sql));
    const response = res(); await createStripePaymentIntent(req(), response);
    expect(response.code).toBe(200); expect(m.create).toHaveBeenCalled();
  });
  it('charges the amount the sender saw after a small FX move', async () => {
    m.quote.mockResolvedValue({...quote, shippingAmount: 108.3, totalAmount: 113.3, bagoNetRevenue: 16.3});
    const response = res(); await createStripePaymentIntent(req(112.8), response);
    expect(response.code).toBe(200);
    expect(m.create).toHaveBeenCalledWith(expect.objectContaining({amount: 11280}), expect.anything());
    const stored = JSON.parse(m.create.mock.calls[0][0].metadata.bago_quote);
    expect(stored.ta).toBe(112.8); expect(stored.ss).toBe(107.8); expect(stored.cp).toBe(92);
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

describe('Bizum checkout for Spanish residents', () => {
  const spanishSender = {id: 'sender', country: 'ES', preferred_currency: 'EUR', stripe_customer_id: 'cus_test'};
  beforeEach(() => {
    const fallback = m.queryOne.getMockImplementation();
    m.queryOne.mockImplementation(async sql => sql.includes('select p.*') ? spanishSender : fallback(sql));
    m.session.mockResolvedValue({id: 'cs_test_1', url: 'https://checkout.stripe.com/c/pay/cs_test_1'});
  });

  it('opens a Bizum session priced from the server quote with booking metadata', async () => {
    const response = res(); await createBizumCheckoutSession({...req(), body: {...req().body, platform: 'mobile'}}, response);
    expect(response.code).toBe(200);
    expect(response.data.url).toBe('https://checkout.stripe.com/c/pay/cs_test_1');
    const params = m.session.mock.calls[0][0];
    expect(params.payment_method_types).toEqual(['bizum']);
    expect(params.line_items[0].price_data).toMatchObject({currency: 'eur', unit_amount: 11280});
    expect(params.payment_intent_data.metadata).toMatchObject({senderId: 'sender', packageId: 'pkg', tripId: 'trip', travelerId: 'traveler', paymentMethodType: 'bizum'});
    expect(JSON.parse(params.payment_intent_data.metadata.bago_quote).ta).toBe(112.8);
    expect(params.success_url).toContain('platform=mobile');
  });

  it('refuses users who do not live in Spain', async () => {
    const fallback = m.queryOne.getMockImplementation();
    m.queryOne.mockImplementation(async sql => sql.includes('select p.*') ? {...spanishSender, country: 'FR'} : fallback(sql));
    const response = res(); await createBizumCheckoutSession(req(), response);
    expect(response.code).toBe(403); expect(response.data.code).toBe('BIZUM_COUNTRY'); expect(m.session).not.toHaveBeenCalled();
  });

  it('refuses non-EUR payments', async () => {
    const response = res(); await createBizumCheckoutSession({...req(), body: {...req().body, currency: 'GBP'}}, response);
    expect(response.code).toBe(400); expect(m.session).not.toHaveBeenCalled();
  });

  it('rejects a stale price like card checkout does', async () => {
    const response = res(); await createBizumCheckoutSession(req(99), response);
    expect(response.code).toBe(409); expect(response.data.code).toBe('CHECKOUT_PRICE_CHANGED'); expect(m.session).not.toHaveBeenCalled();
  });

  it('can be switched off with STRIPE_BIZUM_ENABLED=false', async () => {
    vi.stubEnv('STRIPE_BIZUM_ENABLED', 'false');
    const response = res(); await createBizumCheckoutSession(req(), response);
    expect(response.code).toBe(410); expect(m.session).not.toHaveBeenCalled();
  });

  it('tells the app when to show Bizum', async () => {
    const spain = res(); await getBizumEligibility({user: {id: 'sender'}, query: {currency: 'EUR'}}, spain);
    expect(spain.data.available).toBe(true);
    const gbp = res(); await getBizumEligibility({user: {id: 'sender'}, query: {currency: 'GBP'}}, gbp);
    expect(gbp.data.available).toBe(false);
  });

  it('sends mobile users back to the app after paying', () => {
    let redirect;
    const response = {redirect(code, url) { redirect = {code, url}; }};
    bizumReturnPage('success')({query: {platform: 'mobile', session_id: 'cs_test_1'}}, response);
    expect(redirect).toEqual({code: 302, url: 'com.deracali.boltexponativewind.payments://bizum?status=success&session_id=cs_test_1'});
  });
});

describe('Stripe web checkout', () => {
  beforeEach(() => m.session.mockResolvedValue({id: 'cs_web_1', url: 'https://checkout.stripe.com/c/pay/cs_web_1'}));

  it('opens a hosted page with every enabled method and returns to the website', async () => {
    const response = res(); await createStripeWebCheckoutSession(req(), response);
    expect(response.code).toBe(200);
    const params = m.session.mock.calls[0][0];
    expect(params).not.toHaveProperty('payment_method_types');
    expect(params.line_items[0].price_data).toMatchObject({currency: 'eur', unit_amount: 11280});
    expect(params.payment_intent_data.metadata).toMatchObject({senderId: 'sender', packageId: 'pkg', paymentMethodType: 'checkout'});
    expect(params.success_url).toMatch(/\/payment\/callback\?provider=stripe&session_id=\{CHECKOUT_SESSION_ID\}$/);
  });

  it('applies the same price check as card checkout', async () => {
    const response = res(); await createStripeWebCheckoutSession(req(99), response);
    expect(response.code).toBe(409); expect(m.session).not.toHaveBeenCalled();
  });
});

describe('PayPal is never offered and Bizum stays Spain-only', () => {
  beforeEach(() => m.session.mockResolvedValue({id: 'cs_web_2', url: 'https://checkout.stripe.com/c/pay/cs_web_2'}));

  it('excludes Bizum from web checkout for users outside Spain', async () => {
    await createStripeWebCheckoutSession(req(), res());
    expect(m.session.mock.calls[0][0].excluded_payment_method_types).toEqual(['paypal', 'bizum']);
  });

  it('excludes Bizum from the app card sheet for users outside Spain', async () => {
    await createStripePaymentIntent(req(), res());
    expect(m.create.mock.calls[0][0].excluded_payment_method_types).toEqual(['paypal', 'bizum']);
  });

  it('keeps Bizum for Spanish residents', async () => {
    const fallback = m.queryOne.getMockImplementation();
    m.queryOne.mockImplementation(async sql => sql.includes('select p.*')
      ? {id: 'sender', country: 'Spain', preferred_currency: 'EUR', stripe_customer_id: 'cus_test'} : fallback(sql));
    await createStripeWebCheckoutSession(req(), res());
    expect(m.session.mock.calls[0][0].excluded_payment_method_types).toEqual(['paypal']);
  });

  it('falls back to cards if Stripe rejects the exclusion', async () => {
    m.session
      .mockRejectedValueOnce(Object.assign(new Error('Received unknown parameter: excluded_payment_method_types'), {type: 'StripeInvalidRequestError'}))
      .mockResolvedValueOnce({id: 'cs_web_3', url: 'https://checkout.stripe.com/c/pay/cs_web_3'});
    const response = res(); await createStripeWebCheckoutSession(req(), response);
    expect(response.code).toBe(200);
    expect(m.session.mock.calls[1][0].payment_method_types).toEqual(['card']);
    expect(m.session.mock.calls[1][0]).not.toHaveProperty('excluded_payment_method_types');
  });
});

describe('Stripe exclusion fallback for Spanish residents', () => {
  it('keeps Bizum but not PayPal when Stripe rejects the exclusion', async () => {
    const fallback = m.queryOne.getMockImplementation();
    m.queryOne.mockImplementation(async sql => sql.includes('select p.*')
      ? {id: 'sender', country: 'ES', preferred_currency: 'EUR', stripe_customer_id: 'cus_test'} : fallback(sql));
    m.session
      .mockRejectedValueOnce(Object.assign(new Error('Received unknown parameter: excluded_payment_method_types'), {type: 'StripeInvalidRequestError'}))
      .mockResolvedValueOnce({id: 'cs_web_4', url: 'https://checkout.stripe.com/c/pay/cs_web_4'});
    await createStripeWebCheckoutSession(req(), res());
    expect(m.session.mock.calls[1][0].payment_method_types).toEqual(['card', 'bizum']);
  });
});
