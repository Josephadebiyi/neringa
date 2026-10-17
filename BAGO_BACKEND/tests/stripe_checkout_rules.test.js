import {describe, expect, it, vi} from 'vitest';
import {encodeStripeQuote, verifyStripeBookingIntent} from '../services/stripeCheckoutRules.js';
import {completeStripeBooking} from '../services/stripeBookingCompletion.js';
const quote = {travelerCurrency: 'USD', senderCurrency: 'EUR', travelerPayout: 100,
  convertedTravelerPayout: 92, platformFee: 13.8, processingFee: 2, fxBuffer: 0,
  shippingAmount: 107.8, insuranceAmount: 5, totalAmount: 112.8,
  bagoNetRevenue: 15.8, exchangeRate: .92};
const metadata = {senderId: 'sender', packageId: 'package', tripId: 'trip', travelerId: 'traveler',
  bago_quote: encodeStripeQuote(quote)};
const paid = () => ({id: 'pi_test123', status: 'succeeded', amount: 11280,
  amount_received: 11280, currency: 'eur', metadata: {...metadata}});

describe('Stripe server-side booking verification', () => {
  it('keeps Bago commission and insurance in the converted charge', () => {
    const result = verifyStripeBookingIntent(paid(), metadata);
    expect(result.success).toBe(true);
    expect(result.data.amount).toBe(112.8);
    expect(result.data.quote.platformFee).toBe(13.8);
    expect(result.data.quote.travelerPayout).toBe(100);
    expect(encodeStripeQuote(quote).length).toBeLessThan(500);
  });
  it.each(['processing', 'requires_capture', 'requires_action', 'requires_payment_method', 'canceled'])('does not ship a %s payment', status => {
    expect(verifyStripeBookingIntent({...paid(), status}, metadata).success).toBe(false);
  });
  it.each(['senderId', 'packageId', 'tripId', 'travelerId'])('blocks a mismatched %s', key => {
    expect(verifyStripeBookingIntent(paid(), {...metadata, [key]: 'different'}).success).toBe(false);
  });
  it('rejects a charge that omits Bago commission', () => {
    expect(verifyStripeBookingIntent({...paid(), amount: 9900, amount_received: 9900}, metadata).success).toBe(false);
  });
  it('rejects underpaid, wrong-currency and missing-quote payments', () => {
    expect(verifyStripeBookingIntent({...paid(), amount_received: 10000}, metadata).success).toBe(false);
    expect(verifyStripeBookingIntent({...paid(), currency: 'usd'}, metadata).success).toBe(false);
    expect(verifyStripeBookingIntent({...paid(), metadata: {...metadata, bago_quote: ''}}, metadata).success).toBe(false);
  });
  it('webhook creates a shipment with the paid reference and exact local total', async () => {
    const book = vi.fn(async (req, res) => {
      expect(req.user.id).toBe('sender');
      expect(req.body).toMatchObject({paymentProvider: 'stripe', paymentReference: 'pi_test123',
        currency: 'EUR', amount: 112.8, insuranceCost: 5, termsAccepted: true});
      res.status(201).json({success: true, request: {id: 'shipment'}});
    });
    await expect(completeStripeBooking(paid(), book)).resolves.toMatchObject({request: {id: 'shipment'}});
    expect(book).toHaveBeenCalledTimes(1);
  });
  it('pending booking tells Stripe to retry rather than dropping the paid shipment', async () => {
    const book = vi.fn(async (_, res) => res.status(202).json({success: true, paymentPending: true}));
    await expect(completeStripeBooking(paid(), book)).rejects.toThrow('another attempt');
  });
  it('a processing webhook never creates a shipment', async () => {
    const book = vi.fn();
    await expect(completeStripeBooking({...paid(), status: 'processing'}, book)).rejects.toThrow('not completed');
    expect(book).not.toHaveBeenCalled();
  });
});

it('additional-weight webhook finalizes the existing shipment with the paid quantity', async () => {
  const intent = paid();
  intent.metadata = {...intent.metadata, additionalRequestId: 'existing-request', additionalKg: '3'};
  const book = vi.fn(async (req, res) => {
    expect(req.body).toMatchObject({requestId: 'existing-request', additionalKg: 3});
    res.json({success: true});
  });
  await completeStripeBooking(intent, book);
  expect(book).toHaveBeenCalledTimes(1);
});
