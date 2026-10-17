import {beforeEach, expect, it, vi} from 'vitest';
const m = vi.hoisted(() => ({one: vi.fn(), quote: vi.fn()}));
vi.mock('../lib/postgres/tripCapacity.js', () => ({buildTripCapacitySnapshot: vi.fn().mockResolvedValue({availableKg: 20})}));
vi.mock('../lib/postgres/db.js', () => ({query: vi.fn(), queryOne: m.one}));
vi.mock('../controllers/CurrencyController.js', () => ({buildShipmentCheckoutPreview: m.quote}));
import {buildAdditionalWeightQuote} from '../services/additionalWeightQuote.js';
beforeEach(() => {
  vi.clearAllMocks();
  m.one.mockResolvedValue({id: 'request', sender_id: 'sender', trip_id: 'trip', package_id: 'pkg', currency: 'EUR', status: 'accepted_awaiting_inspection', amount: 999, package_weight: 2});
  m.quote.mockImplementation(async ({weight}) => ({tripId: 'trip', travelerId: 'traveler', travelerPricePerKg: 10, travelerPayout: 10 * weight, totalAmount: 11.5 * weight}));
});
it('prices only the extra kg using the trip quote, never the previous fee-inclusive total', async () => {
  const quote = await buildAdditionalWeightQuote({requestId: 'request', senderId: 'sender', additionalKg: 3});
  expect(m.quote).toHaveBeenCalledWith({tripId: 'trip', weight: 3, senderCurrency: 'EUR', insurance: false});
  expect(quote.travelerPayout).toBe(30);
  expect(quote.totalAmount).toBe(34.5);
  expect(quote.requestId).toBe('request');
});
it('rejects missing/unowned shipments and non-positive or invalid kg', async () => {
  for (const kg of [0, -1, 'invalid', Infinity]) await expect(buildAdditionalWeightQuote({requestId: 'request', senderId: 'sender', additionalKg: kg})).rejects.toThrow('greater than zero');
  m.one.mockResolvedValue(null);
  await expect(buildAdditionalWeightQuote({requestId: 'request', senderId: 'different', additionalKg: 1})).rejects.toThrow('not found');
});
it('rejects additional weight after transit starts', async () => {
  m.one.mockResolvedValue({status: 'intransit'});
  await expect(buildAdditionalWeightQuote({requestId: 'request', senderId: 'sender', additionalKg: 1})).rejects.toThrow('before the trip starts');
});
