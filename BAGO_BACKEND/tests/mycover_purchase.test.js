import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('axios', () => ({ default: { post: vi.fn() } }));
vi.mock('../lib/postgres/db.js', () => ({ query: vi.fn() }));
vi.mock('../lib/postgres/profiles.js', () => ({ findProfileById: vi.fn() }));
vi.mock('../lib/postgres/shipping.js', () => ({ getTripById: vi.fn() }));
vi.mock('../services/myCoverPricing.js', () => ({ convertDeclaredValueToNgn: vi.fn(async v => v) }));

import axios from 'axios';
import { query } from '../lib/postgres/db.js';
import { findProfileById } from '../lib/postgres/profiles.js';
import { getTripById } from '../lib/postgres/shipping.js';
import { isInsuranceSubmissionInFlight, purchaseMyCoverPolicy } from '../services/myCoverService.js';

const request = {
  id: 'shipment-1', senderId: 'sender-1', travelerId: 'traveler-1', tripId: 'trip-1',
  insurance: true, insuranceCost: 3000, currency: 'NGN',
  package: { value: 100000, description: 'Laptop', images: ['https://example.com/item.jpg'],
    pickupAddress: 'Lagos pickup', deliveryAddress: 'Abuja delivery', receiverName: 'Receiver', receiverPhone: '2348000000002' },
};
const sender = { firstName: 'Test', lastName: 'Sender', email: 'sender@example.com',
  phone: '2348000000001', verifiedDateOfBirth: '1990-01-01', kycVerifiedData: { gender: 'male' } };

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubEnv('MYCOVER_SECRET_KEY', 'MCASECK_TEST|test');
  query.mockResolvedValue({ rows: [{ id: request.id }] });
  findProfileById.mockImplementation(async id => id === request.senderId ? sender : { firstName: 'Test', lastName: 'Traveler' });
  getTripById.mockResolvedValue({ travelMeans: 'Air Plane', departureDate: '2026-12-01' });
});
afterEach(() => vi.unstubAllEnvs());

function finalState() { return query.mock.calls.at(-1)[1]; }

describe('MyCover purchase delivery', () => {
  it('sends sender, shipment, trip and recipient information with the runtime key and saves the policy', async () => {
    axios.post.mockResolvedValue({ data: { responseCode: 1, data: { policy: { id: 'policy-1' } } } });
    await expect(purchaseMyCoverPolicy(request)).resolves.toBe('policy-1');
    expect(axios.post).toHaveBeenCalledWith(expect.stringContaining('/buy-git-ondemand'), expect.objectContaining({
      email: sender.email, date_of_birth: '1990-01-01', pickup_location: 'Lagos pickup',
      drop_off_location: 'Abuja delivery', shipping_date: '2026-12-01', vehicle_type: 'Air Plane',
      total_value: 100000, metadata: expect.objectContaining({ receiver_name: 'Receiver', request_id: request.id }),
    }), expect.objectContaining({ headers: expect.objectContaining({ Authorization: 'Bearer MCASECK_TEST|test' }) }));
    expect(finalState()[1]).toBe('active');
    expect(finalState()[2]).toBe('policy-1');
  });

  it('records missing customer fields as failed without submitting', async () => {
    findProfileById.mockResolvedValue({ ...sender, phone: '' });
    await expect(purchaseMyCoverPolicy(request)).rejects.toThrow('phone_number');
    expect(axios.post).not.toHaveBeenCalled();
    expect(finalState()[1]).toBe('failed');
  });

  it('does not buy a second policy when another call already claimed the shipment', async () => {
    query.mockResolvedValue({ rows: [] });
    await expect(purchaseMyCoverPolicy(request)).resolves.toBeNull();
    expect(axios.post).not.toHaveBeenCalled();
  });

  it('does not mistake a purchase id for an issued policy', async () => {
    axios.post.mockResolvedValue({ data: { responseCode: 1, data: { id: 'purchase-1' } } });
    await expect(purchaseMyCoverPolicy(request)).resolves.toBeNull();
    expect(finalState()[1]).toBe('pending_purchase');
    expect(finalState()[2]).toBeNull();
  });

  it('records provider rejection even when HTTP status is 200', async () => {
    axios.post.mockResolvedValue({ data: { success: false, message: 'Rejected' } });
    await expect(purchaseMyCoverPolicy(request)).rejects.toThrow('Rejected');
    expect(finalState()[1]).toBe('failed');
  });

  it('keeps a timed-out purchase pending for reconciliation instead of allowing a second wallet debit', async () => {
    axios.post.mockRejectedValue(new Error('timeout'));
    await expect(purchaseMyCoverPolicy(request)).rejects.toThrow('timeout');
    expect(finalState()[1]).toBe('pending_purchase');
    expect(JSON.parse(finalState()[3])).toHaveProperty('submittedAt');
  });

  it('records an unavailable API key without sending a request', async () => {
    vi.stubEnv('MYCOVER_SECRET_KEY', '');
    await expect(purchaseMyCoverPolicy(request)).resolves.toBeNull();
    expect(finalState()[1]).toBe('failed');
    expect(axios.post).not.toHaveBeenCalled();
  });
});

it.each([
  {Gender: {value: 'female'}},
  {gender: 'unknown', result: {Sex: 'F'}},
  {identity: {gender: {label: 'Male'}}},
])('reads valid gender from nested KYC data: %j', async identity => {
  findProfileById.mockImplementation(async id => id === request.senderId ? {...sender, kycVerifiedData: identity} : {});
  axios.post.mockResolvedValue({data: {responseCode: 1, data: {policy: {id: 'policy-1'}}}});
  await purchaseMyCoverPolicy(request);
  expect(axios.post.mock.calls[0][1].gender).toBe(identity.identity ? 'Male' : 'Female');
});
it('uses sender-supplied insurance details when KYC did not supply gender', async () => {
  findProfileById.mockImplementation(async id => id === request.senderId ? {...sender, kycVerifiedData: {}} : {});
  axios.post.mockResolvedValue({data: {responseCode: 1, data: {policy: {id: 'policy-1'}}}});
  await purchaseMyCoverPolicy({...request, insurancePolicyData: {customerDetails: {gender: 'female'}}});
  expect(axios.post.mock.calls[0][1].gender).toBe('Female');
});
it('never guesses gender when the customer did not provide it', async () => {
  findProfileById.mockImplementation(async id => id === request.senderId ? {...sender, kycVerifiedData: {}} : {});
  await expect(purchaseMyCoverPolicy(request)).rejects.toMatchObject({code: 'INSURANCE_CUSTOMER_DETAILS_REQUIRED', missingFields: ['gender']});
  expect(axios.post).not.toHaveBeenCalled();
});

describe('retrying rejected MyCover purchases', () => {
  const validationError = {responseCode: 0, responseText: ['item_value must not be less than 5000']};

  it('records a MyCover rejection as retryable rather than submitted', async () => {
    axios.post.mockResolvedValue({data: validationError});
    await expect(purchaseMyCoverPolicy(request)).rejects.toThrow('MyCover API error');
    expect(finalState()[1]).toBe('failed');
    const saved = JSON.parse(finalState()[3]);
    expect(saved).not.toHaveProperty('submittedAt');
    expect(saved).toHaveProperty('failedAt');
    expect(saved.attempts).toBe(1);
    expect(isInsuranceSubmissionInFlight('failed', saved)).toBe(false);
  });

  it('retries a shipment stuck under the old "already submitted" rejection', async () => {
    query.mockImplementation(async (sql) => sql.includes('SELECT insurance_policy_id')
      ? {rows: [{insurance_status: 'failed', insurance_policy_data: {submittedAt: '2026-10-28T10:00:00Z', error: validationError, attempts: 2}}]}
      : {rows: [{id: request.id}]});
    axios.post.mockResolvedValue({data: {responseCode: 1, data: {policy: {id: 'policy-2'}}}});
    await expect(purchaseMyCoverPolicy(request)).resolves.toBe('policy-2');
    const claim = query.mock.calls.find(([sql]) => sql.includes("insurance_status = 'pending_purchase'"));
    expect(claim[0]).toContain("OR insurance_status = 'failed'");
    expect(JSON.parse(claim[1][1]).attempts).toBe(3);
  });

  it('never retries a purchase that may already have created a policy', () => {
    expect(isInsuranceSubmissionInFlight('pending_purchase', {submittedAt: 'x'})).toBe(true);
    expect(isInsuranceSubmissionInFlight('failed', {purchaseId: 'purchase-1'})).toBe(true);
    expect(isInsuranceSubmissionInFlight('failed', {response: {}})).toBe(true);
    expect(isInsuranceSubmissionInFlight('failed', {submittedAt: 'x'})).toBe(false);
  });
});
