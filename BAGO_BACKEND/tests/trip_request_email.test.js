import { beforeEach, expect, it, vi } from 'vitest';
const m = vi.hoisted(() => ({ query: vi.fn(), send: vi.fn() }));
vi.mock('../lib/postgres/db.js', () => ({ withTransaction: async work => work({ query: m.query }) }));
vi.mock('../services/emailNotifications.js', () => ({ sendNewRequestToTravelerEmail: m.send }));
import { notifyTripOwnerByEmail } from '../services/tripRequestEmail.js';
const booking = { request: { id: 'request-1', travelerName: 'Ada', senderName: 'Sam' },
  owner: { email: 'owner@example.com' }, packageDetails: 'Clothes, 2kg', trip: { id: 'trip-1' } };
let info;
beforeEach(() => {
  vi.clearAllMocks(); info = {};
  m.send.mockResolvedValue(true);
  m.query.mockImplementation(async (sql) => {
    if (sql.startsWith('select')) return { rows: [{ payment_info: info }] };
    info.tripOwnerEmailSentAt = '2026-10-17';
    return { rows: [] };
  });
});
it('sends after an existing request recovers from an escrow failure', async () => {
  await notifyTripOwnerByEmail(booking);
  expect(m.send).toHaveBeenCalledWith('owner@example.com', 'Ada', 'Sam', 'Clothes, 2kg', booking.trip, 'request-1');
  expect(info.tripOwnerEmailSentAt).toBeTruthy();
});
it('does not email again on another booking or webhook retry', async () => {
  await notifyTripOwnerByEmail(booking);
  await notifyTripOwnerByEmail(booking);
  expect(m.send).toHaveBeenCalledTimes(1);
});
it('does not mark a rejected email as sent and permits another attempt', async () => {
  m.send.mockResolvedValueOnce(false);
  expect(await notifyTripOwnerByEmail(booking)).toBe(false);
  expect(info.tripOwnerEmailSentAt).toBeUndefined();
  expect(await notifyTripOwnerByEmail(booking)).toBe(true);
  expect(m.send).toHaveBeenCalledTimes(2);
});
