import { beforeEach, expect, it, vi } from 'vitest';
const send = vi.hoisted(() => vi.fn());
vi.mock('../services/resendClient.js', () => ({ resend: { emails: { send } } }));
import { sendNewRequestToTravelerEmail } from '../services/emailNotifications.js';
const args = ['owner@example.com', 'Ada', 'Sam', 'Clothes, 2kg', {fromLocation: 'Madrid', toLocation: 'Paris', departureDate: '2026-11-01'}, 'request-1'];
beforeEach(() => vi.clearAllMocks());
it('uses a provider idempotency key and links to the actual delivery', async () => {
  send.mockResolvedValue({data: {id: 'email-1'}, error: null});
  expect(await sendNewRequestToTravelerEmail(...args)).toBe(true);
  expect(send).toHaveBeenCalledWith(expect.objectContaining({to: 'owner@example.com', html: expect.stringContaining('tab=deliveries&requestId=request-1')}), {idempotencyKey: 'shipment-request/request-1'});
});
it('reports provider errors rather than logging a false success', async () => {
  send.mockResolvedValue({data: null, error: {message: 'Domain not verified'}});
  expect(await sendNewRequestToTravelerEmail(...args)).toBe(false);
});
