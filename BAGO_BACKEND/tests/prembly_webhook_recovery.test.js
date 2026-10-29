import crypto from 'crypto';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

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

import { premblyWebhook, reconcileUnhandledPremblyWebhookEvents, syncPremblyReferenceForUser, syncPremblyResult, reconcilePremblySessions } from '../controllers/PremblyController.js';
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
afterEach(() => vi.unstubAllEnvs());
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
  it('recovers older queued webhooks whose identifiers were never extracted into columns', async () => {
    const oldPayload = { verification: { status: 'VERIFIED' }, data: { widget_info: { session_id: 'known-session' } } };
    mocks.query.mockImplementation(async sql => ({ rows: sql.includes('SELECT id, reference_id')
      ? [{ id: 'event-id', rawPayload: oldPayload, createdAt: new Date() }] : [] }));
    expect(await reconcileUnhandledPremblyWebhookEvents({ notify: false })).toMatchObject({ resolved: 1 });
    expect(mocks.approve).toHaveBeenCalledWith(userId, expect.any(Object));
  });
  it('reads API credentials loaded after module import for automatic syncing', async () => {
    vi.stubEnv('PREMBLY_API_KEY', 'late-key');
    vi.stubEnv('PREMBLY_APP_ID', 'late-app');
    mocks.get.mockResolvedValueOnce({ data: payload });
    expect(await syncPremblyReferenceForUser(userId, 'known-session', { notify: false })).toMatchObject({ success: true, status: 'approved' });
    expect(mocks.get).toHaveBeenCalledWith(expect.any(String), expect.objectContaining({ headers: expect.objectContaining({ 'x-api-key': 'late-key', app_id: 'late-app' }) }));
  });
});


describe('Prembly result latency regressions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv('PREMBLY_API_KEY', 'test-api-key');
    mocks.query.mockResolvedValue({ rows: [] });
    mocks.queryOne.mockImplementation(async sql => sql.includes('SELECT email') ? { kycStatus: 'pending' } : null);
    mocks.approve.mockResolvedValue({});
  });

  it('applies a signed webhook with identifiers nested in widget_info immediately', async () => {
    vi.stubEnv('PREMBLY_PUBLIC_KEY', 'test-public-key');
    const body = { verification: { status: 'VERIFIED' }, data: { widget_info: { session_id: 'known-session', user_ref: 'local-ref' } } };
    const rawBody = Buffer.from(JSON.stringify(body));
    const signature = crypto.createHmac('sha256', 'test-public-key').update(rawBody).digest('base64');
    mocks.queryOne.mockImplementation(async (sql, params) => {
      if (sql.includes('SELECT user_id') && params[0] === 'known-session') return { userId };
      if (sql.includes('SELECT email')) return { kycStatus: 'pending' };
      return null;
    });
    mocks.query.mockResolvedValue({ rows: [{ id: 'event-id' }] });
    const res = response();
    await premblyWebhook({ headers: { 'x-prembly-signature': signature, token: 'token-1' }, rawBody, body }, res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(mocks.approve).toHaveBeenCalledWith(userId, expect.any(Object));
    expect(mocks.get).not.toHaveBeenCalled();
  });

  it('user sync consumes the same stored webhook as admin refresh without waiting for either API', async () => {
    mocks.queryOne.mockImplementation(async sql => {
      if (sql.includes('SELECT kyc_status AS')) return { kycStatus: 'pending', kycVerifiedData: { verificationRef: 'local-ref', sessionId: 'known-session' } };
      if (sql.includes('FROM public.prembly_webhook_events')) return { id: 'event-id', rawPayload: payload };
      if (sql.includes('SELECT email')) return { kycStatus: 'pending' };
      return null;
    });
    const res = response();
    await syncPremblyResult({ user: { id: userId }, body: {}, headers: {} }, res);
    expect(res.json).toHaveBeenCalledWith({ success: true, kycStatus: 'approved', source: 'stored_webhook' });
    expect(mocks.get).not.toHaveBeenCalled();
  });

  it('looks up the recorded checker session first and includes the organisation header', async () => {
    vi.stubEnv('PREMBLY_ORGANISATION_ID', 'test-org');
    mocks.queryOne.mockImplementation(async sql => {
      if (sql.includes('SELECT session_id AS')) return { sessionId: 'known-session' };
      if (sql.includes('SELECT email')) return { kycStatus: 'pending' };
      return null;
    });
    mocks.get.mockResolvedValueOnce({ data: payload });
    expect(await syncPremblyReferenceForUser(userId, 'local-ref', { notify: false })).toMatchObject({ status: 'approved', source: 'checker_widget_api' });
    expect(mocks.get).toHaveBeenCalledTimes(1);
    expect(mocks.get).toHaveBeenCalledWith(expect.stringContaining('/known-session/'), expect.objectContaining({
      timeout: 4000, headers: expect.objectContaining({ 'x-organisation-id': 'test-org' }),
    }));
  });

  it('tries the checker endpoint when Identitypass responds with an unknown status rather than 404', async () => {
    mocks.get.mockResolvedValueOnce({ data: { status: true } }).mockResolvedValueOnce({ data: payload });
    expect(await syncPremblyReferenceForUser(userId, 'known-session', { notify: false })).toMatchObject({ status: 'approved', source: 'checker_widget_api' });
    expect(mocks.get).toHaveBeenCalledTimes(2);
  });

  it('tries the alternate endpoint after a timeout, not only after 404', async () => {
    mocks.get.mockRejectedValueOnce(new Error('timeout')).mockResolvedValueOnce({ data: payload });
    expect(await syncPremblyReferenceForUser(userId, 'known-session', { notify: false })).toMatchObject({ status: 'approved' });
    expect(mocks.get).toHaveBeenCalledTimes(2);
  });

  it('shares one provider lookup between overlapping user and background sync requests', async () => {
    let release;
    mocks.get.mockImplementationOnce(() => new Promise(resolve => { release = resolve; }));
    const first = syncPremblyReferenceForUser(userId, 'local-ref', { notify: false, sessionId: 'known-session' });
    const second = syncPremblyReferenceForUser(userId, 'known-session', { notify: false });
    await vi.waitFor(() => expect(mocks.get).toHaveBeenCalledTimes(1));
    release({ data: payload });
    expect(await first).toMatchObject({ status: 'approved' });
    expect(await second).toMatchObject({ status: 'approved' });
    expect(mocks.approve).toHaveBeenCalledTimes(1);
  });

  it('does not trust an approval supplied by a client callback when Prembly still reports pending', async () => {
    mocks.queryOne.mockImplementation(async sql => {
      if (sql.includes('SELECT kyc_status AS')) return { kycStatus: 'pending', kycVerifiedData: { verificationRef: 'local-ref', sessionId: 'known-session' } };
      if (sql.includes('SELECT email')) return { kycStatus: 'pending' };
      return null;
    });
    mocks.get.mockResolvedValueOnce({ data: { status: 'pending' } });
    const res = response();
    await syncPremblyResult({ user: { id: userId }, body: { sdkResponse: { status: 'approved' } }, headers: {} }, res);
    expect(mocks.approve).not.toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ kycStatus: 'pending', source: 'checker_widget_api' }));
    const pendingWrite = mocks.query.mock.calls.find(([sql]) => sql.includes("SET kyc_status = 'pending'"));
    expect(pendingWrite[0]).toContain("COALESCE(kyc_verified_data, '{}'::jsonb) ||");
  });

  it('checks another completed session while an earlier network lookup is still waiting', async () => {
    let release;
    mocks.query.mockImplementation(async sql => ({ rows: sql.includes('SELECT s.id') ? [
      { id: 'slow', userId, reference: 'slow-ref', createdAt: new Date() },
      { id: 'ready', userId, reference: 'ready-ref', createdAt: new Date() },
    ] : [] }));
    mocks.get.mockImplementation((url, config) => config.params?.verification_ref === 'slow-ref'
      ? new Promise(resolve => { release = resolve; }) : Promise.resolve({ data: payload }));
    const pass = reconcilePremblySessions({ notify: false });
    await vi.waitFor(() => expect(mocks.approve).toHaveBeenCalledTimes(1));
    release({ data: { status: 'pending' } });
    expect(await pass).toMatchObject({ checked: 2, updated: 1 });
  });
});
