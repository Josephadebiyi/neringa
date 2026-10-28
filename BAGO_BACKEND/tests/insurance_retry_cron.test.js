import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('node-cron', () => ({ default: { schedule: vi.fn() } }));
vi.mock('../lib/postgres/db.js', () => ({ query: vi.fn() }));
vi.mock('../lib/postgres/shipping.js', () => ({ getShipmentRequestById: vi.fn() }));
vi.mock('../services/myCoverService.js', () => ({ purchaseMyCoverPolicy: vi.fn() }));

import { query } from '../lib/postgres/db.js';
import { getShipmentRequestById } from '../lib/postgres/shipping.js';
import { purchaseMyCoverPolicy } from '../services/myCoverService.js';
import { MAX_INSURANCE_ATTEMPTS, retryFailedInsurancePurchases } from '../cron/insuranceRetryCron.js';

beforeEach(() => vi.clearAllMocks());

describe('insurance retry job', () => {
  it('retries failed, undelivered shipments under the attempt cap', async () => {
    query.mockResolvedValue({ rows: [{ id: 'a' }, { id: 'b' }] });
    getShipmentRequestById.mockImplementation(async id => ({ id }));
    purchaseMyCoverPolicy.mockResolvedValueOnce('policy-a').mockRejectedValueOnce(new Error('still rejected'));
    await expect(retryFailedInsurancePurchases()).resolves.toEqual({ checked: 2, activated: 1 });
    const [sql, params] = query.mock.calls[0];
    expect(sql).toContain("insurance_status = 'failed'");
    expect(sql).toContain('MyCover required sender fields are missing');
    expect(params[0]).not.toContain('delivered');
    expect(params[1]).toBe(MAX_INSURANCE_ATTEMPTS);
  });
});
