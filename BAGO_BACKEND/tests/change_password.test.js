import { beforeEach, describe, expect, it, vi } from 'vitest';
import bcrypt from 'bcrypt';

const mocks = vi.hoisted(() => ({
  query: vi.fn().mockResolvedValue({ rows: [], rowCount: 0 }),
  queryOne: vi.fn(),
}));

vi.mock('../lib/postgres/db.js', () => ({
  query: mocks.query,
  queryOne: mocks.queryOne,
}));

import { changePassword } from '../controllers/userController.js';

function mockRes() {
  const res = { _code: null, _body: null };
  res.status = (code) => { res._code = code; return res; };
  res.json = (body) => { res._body = body; return res; };
  return res;
}

const TEMP_PASSWORD = 'Temp-Passw0rd';

describe('changePassword (POST /user/change-password)', () => {
  let tempPasswordHash;

  beforeEach(async () => {
    tempPasswordHash = await bcrypt.hash(TEMP_PASSWORD, 10);
    mocks.query.mockReset().mockResolvedValue({ rows: [], rowCount: 0 });
    mocks.queryOne.mockReset();
  });

  it('rejects when current or new password is missing', async () => {
    const req = { user: { id: 'u1' }, body: { currentPassword: TEMP_PASSWORD } };
    const res = mockRes();
    await changePassword(req, res);
    expect(res._code).toBe(400);
    expect(mocks.query).not.toHaveBeenCalled();
  });

  it('rejects a new password shorter than 6 characters', async () => {
    const req = { user: { id: 'u1' }, body: { currentPassword: TEMP_PASSWORD, newPassword: 'abc' } };
    const res = mockRes();
    await changePassword(req, res);
    expect(res._code).toBe(400);
  });

  it('rejects when the current password does not match', async () => {
    mocks.queryOne.mockResolvedValue({ password_hash: tempPasswordHash, account_type: 'company', signup_method: 'admin_created' });
    const req = { user: { id: 'u1' }, body: { currentPassword: 'wrong-password', newPassword: 'NewPassw0rd!' } };
    const res = mockRes();
    await changePassword(req, res);
    expect(res._code).toBe(400);
    expect(mocks.query).not.toHaveBeenCalled();
  });

  it('admin-created business account: starts the 14-day grace period on the forced first password change', async () => {
    mocks.queryOne.mockResolvedValue({ password_hash: tempPasswordHash, account_type: 'company', signup_method: 'admin_created' });
    const req = { user: { id: 'biz-1' }, body: { currentPassword: TEMP_PASSWORD, newPassword: 'NewPassw0rd!' } };
    const res = mockRes();
    await changePassword(req, res);

    expect(res._code).toBe(200);
    expect(mocks.query).toHaveBeenCalledOnce();
    const [sql, params] = mocks.query.mock.calls[0];
    expect(sql).toContain('must_change_password = false');
    expect(sql).toContain('business_grace_period_started_at');
    expect(params[0]).toBe('biz-1');
    // startsGracePeriod flag passed as $3
    expect(params[2]).toBe(true);
    // the new password was actually hashed, not stored in plaintext
    expect(params[1]).not.toBe('NewPassw0rd!');
    expect(await bcrypt.compare('NewPassw0rd!', params[1])).toBe(true);
  });

  it('self-signup business account changing their password later does not re-trigger a grace period start', async () => {
    mocks.queryOne.mockResolvedValue({ password_hash: tempPasswordHash, account_type: 'company', signup_method: 'email' });
    const req = { user: { id: 'biz-2' }, body: { currentPassword: TEMP_PASSWORD, newPassword: 'NewPassw0rd!' } };
    const res = mockRes();
    await changePassword(req, res);

    expect(res._code).toBe(200);
    const [, params] = mocks.query.mock.calls[0];
    // startsGracePeriod is false — the SQL COALESCEs, preserving the
    // grace-period start already stamped at signup instead of resetting it.
    expect(params[2]).toBe(false);
  });

  it('individual account changing their password is unaffected by grace-period logic', async () => {
    mocks.queryOne.mockResolvedValue({ password_hash: tempPasswordHash, account_type: 'individual', signup_method: 'email' });
    const req = { user: { id: 'user-1' }, body: { currentPassword: TEMP_PASSWORD, newPassword: 'NewPassw0rd!' } };
    const res = mockRes();
    await changePassword(req, res);

    expect(res._code).toBe(200);
    const [, params] = mocks.query.mock.calls[0];
    expect(params[2]).toBe(false);
  });
});
