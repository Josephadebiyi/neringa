import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ query: vi.fn(), queryOne: vi.fn(), approve: vi.fn(), get: vi.fn() }));
vi.mock('../lib/postgres/db.js', () => ({ query: mocks.query, queryOne: mocks.queryOne }));
vi.mock('../lib/postgres/accounts.js', () => ({ markKycApproved: mocks.approve }));
vi.mock('axios', () => ({ default: { get: mocks.get } }));
vi.mock('../services/emailNotifications.js', () => ({
  sendKycApprovedEmail: vi.fn().mockResolvedValue(true),
  sendKycSubmittedEmail: vi.fn().mockResolvedValue(true),
  sendKycDeclinedEmail: vi.fn().mockResolvedValue(true),
}));
vi.mock('../services/pushNotificationService.js', () => ({ sendPushNotification: vi.fn().mockResolvedValue(true) }));
vi.mock('../services/securityService.js', () => ({ runPreKycChecks: vi.fn() }));

import { premblyWebhook, reconcileUnhandledPremblyWebhookEvents, syncPremblyReferenceForUser } from '../controllers/PremblyController.js';
const userId = '11111111-1111-4111-8111-111111111111';
const payload = { verification_ref: 'provider-result', session_id: 'known-session', status: 'approved' };
function response() {
  const res = { status: vi.fn(), json: vi.fn() };
  res.status.mockReturnValue(res);
  res.json.mockReturnValue(res);
  return res;
}
function handledWrites() {
  return mocks.query.mock.calls.filter(([sql]) => sql.includes('SET handled = true'));
}
describe('automatic Prembly webhook recovery', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv('NODE_ENV', 'test');
    vi.stubEnv('PREMBLY_WEBHOOK_SECRET', 'test-secret');
    mocks.query.mockResolvedValue({ rows: [{ id: 'event-id' }] });
    mocks.queryOne.mockImplementation(async (sql, params) => {
      if (sql.includes('SELECT user_id') && params[0] === 'known-session') return { userId };
      if (sql.includes('SELECT email')) return { kycStatus: 'pending' };
      return null;
    });
    mocks.approve.mockResolvedValue({});
  });
  it('matches the session ID when the provider verification reference is different', async () => {
    const res = response();
    await premblyWebhook({ headers: { 'x-webhook-secret': 'test-secret' }, body: payload }, res);
    expect(mocks.approve).toHaveBeenCalledWith(userId, expect.any(Object));
    const insert = mocks.query.mock.calls.find(([sql]) => sql.includes('INSERT INTO public.prembly_webhook_events'));
    expect(insert[1][5]).toBe(false);
    expect(handledWrites()).toHaveLength(1);
    expect(res.status).toHaveBeenCalledWith(200);
  });
  it('leaves a failed result queued and asks Prembly to retry delivery', async () => {
    mocks.approve.mockRejectedValueOnce(new Error('database unavailable'));
    const res = response();
    await premblyWebhook({ headers: { 'x-webhook-secret': 'test-secret' }, body: payload }, res);
    expect(handledWrites()).toHaveLength(0);
    expect(res.status).toHaveBeenCalledWith(503);
  });
  it('recovers queued events using all recorded identifiers', async () => {
    mocks.query.mockImplementation(async (sql) => ({ rows: sql.includes('SELECT id, reference_id')
      ? [{ id: 'event-id', referenceId: 'provider-result', sessionId: 'known-session', rawPayload: payload, createdAt: new Date() }]
      : [] }));
    expect(await reconcileUnhandledPremblyWebhookEvents({ notify: false })).toMatchObject({ resolved: 1 });
    expect(mocks.approve).toHaveBeenCalledWith(userId, expect.any(Object));
    expect(handledWrites()).toHaveLength(1);
  });
  it('does not discard queued events when applying the result fails', async () => {
    mocks.query.mockImplementation(async (sql) => ({ rows: sql.includes('SELECT id, reference_id')
      ? [{ id: 'event-id', sessionId: 'known-session', rawPayload: payload, createdAt: new Date() }]
      : [] }));
    mocks.approve.mockRejectedValueOnce(new Error('database unavailable'));
    expect(await reconcileUnhandledPremblyWebhookEvents({ notify: false })).toMatchObject({ resolved: 0, stillUnresolved: 1 });
    expect(handledWrites()).toHaveLength(0);
  });
  it('reads API credentials loaded after module import for automatic syncing', async () => {
    vi.stubEnv('PREMBLY_API_KEY', 'late-key');
    vi.stubEnv('PREMBLY_APP_ID', 'late-app');
    mocks.get.mockResolvedValueOnce({ data: payload });
    expect(await syncPremblyReferenceForUser(userId, 'known-session', { notify: false })).toMatchObject({ success: true, status: 'approved' });
    expect(mocks.get).toHaveBeenCalledWith(expect.any(String), expect.objectContaining({ headers: expect.objectContaining({ 'x-api-key': 'late-key', app_id: 'late-app' }) }));
  });
});
