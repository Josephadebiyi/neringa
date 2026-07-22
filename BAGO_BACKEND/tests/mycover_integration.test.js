import crypto from 'crypto';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../services/currencyConverter.js', () => ({
  convertCurrency: vi.fn(),
}));

vi.mock('../lib/postgres/db.js', () => ({
  query: vi.fn(),
  queryOne: vi.fn(),
}));

vi.mock('../services/pushNotificationService.js', () => ({
  sendPushNotification: vi.fn(() => Promise.resolve()),
}));

import { convertCurrency } from '../services/currencyConverter.js';
import {
  convertDeclaredValueToNgn,
  getMyCoverPremium,
  MYCOVER_PREMIUM_CAP_NGN,
} from '../services/myCoverPricing.js';
import { validSignature } from '../controllers/MyCoverWebhookController.js';
import { policyPayload } from '../services/myCoverService.js';

describe('MyCover pricing', () => {
  beforeEach(() => vi.clearAllMocks());

  it('charges 0.5% in NGN below the cap', async () => {
    await expect(getMyCoverPremium(200000, 'NGN')).resolves.toBe(1000);
    expect(MYCOVER_PREMIUM_CAP_NGN).toBe(3000);
    expect(convertCurrency).not.toHaveBeenCalled();
  });

  it('caps the premium at NGN 3,000 and converts it to checkout currency', async () => {
    convertCurrency
      .mockResolvedValueOnce(1000000)
      .mockResolvedValueOnce(1.84);
    await expect(getMyCoverPremium(650, 'EUR')).resolves.toBe(1.84);
    expect(convertCurrency).toHaveBeenNthCalledWith(1, 650, 'EUR', 'NGN');
    expect(convertCurrency).toHaveBeenCalledWith(3000, 'NGN', 'EUR');
  });

  it('converts declared item value into whole NGN for the policy', async () => {
    convertCurrency.mockResolvedValueOnce(155000);
    await expect(convertDeclaredValueToNgn(100, 'USD')).resolves.toBe(155000);
    expect(convertCurrency).toHaveBeenCalledWith(100, 'USD', 'NGN');
  });

  it('uses a BAGO internal sender reference when no vehicle plate exists', async () => {
    convertCurrency.mockResolvedValueOnce(310000);
    const payload = await policyPayload({
      request: {
        id: 'shipment-1',
        senderId: '12345678-90ab-cdef-1234-567890abcdef',
        travelerId: 'traveler-1',
        currency: 'EUR',
        amount: 200,
        package: { value: 200, description: 'Documents' },
      },
      sender: {
        firstName: 'Bago',
        lastName: 'Sender',
        email: 'sender@example.com',
        phone: '2348000000000',
        dateOfBirth: '1990-01-01',
        kycVerifiedData: { data: { gender: 'male' } },
      },
      traveler: {},
    });

    expect(payload.vehicle_plate_number).toBe('BAGO-12345678-90ab-c');
    expect(payload.item_details[0].value).toBe(310000);
    expect(payload.item_details[0]).toHaveProperty('image_url');
    expect(payload.total_value).toBe(310000);
    expect(payload.bought_for_self).toBe(true);
    expect(payload.gender).toBe('Male');
    expect(payload.date_of_birth).toBe('1990-01-01');
    expect(payload.product_id).toBe('4ca89151-78e9-4cda-9a3b-20f759f89a41');
    expect(payload.metadata.declared_value_currency).toBe('EUR');
  });
});

describe('MyCover webhook signature', () => {
  it('accepts the documented HMAC-SHA512 signature', () => {
    const body = { event: 'purchase.successful', data: { id: 'purchase-1' } };
    const secret = 'MCASECK_TEST|example';
    const signature = crypto
      .createHmac('sha512', secret)
      .update(JSON.stringify(body))
      .digest('hex');

    expect(validSignature(body, signature, secret)).toBe(true);
    expect(validSignature(body, '0'.repeat(128), secret)).toBe(false);
  });
});
