import { describe, it, expect, vi } from 'vitest';
import { requireBusinessPermission } from '../middleware/businessAuthorization.js';

function mockRes() {
  const res = {};
  res.statusCode = null;
  res.body = null;
  res.status = vi.fn((code) => { res.statusCode = code; return res; });
  res.json = vi.fn((body) => { res.body = body; return res; });
  return res;
}

describe('requireBusinessPermission', () => {
  it('is a no-op when the real business owner is logged in (no actingStaff)', async () => {
    const req = { user: { id: 'owner-1' } };
    const res = mockRes();
    const next = vi.fn();

    await requireBusinessPermission('accounts.withdraw')(req, res, next);

    expect(next).toHaveBeenCalledOnce();
    expect(res.status).not.toHaveBeenCalled();
  });

  it('allows a staff sub-account that has the required permission', async () => {
    const req = {
      user: { id: 'owner-1' },
      actingStaff: { id: 'staff-1', permissions: ['deliveries.manage', 'accounts.view'] },
      get: () => 'test-agent',
    };
    const res = mockRes();
    const next = vi.fn();

    await requireBusinessPermission('accounts.view')(req, res, next);

    expect(next).toHaveBeenCalledOnce();
    expect(res.status).not.toHaveBeenCalled();
  });

  it('blocks a staff sub-account that lacks the required permission', async () => {
    const req = {
      user: { id: 'owner-1' },
      actingStaff: { id: 'staff-1', permissions: ['deliveries.manage'] },
      get: () => 'test-agent',
      ip: '127.0.0.1',
      method: 'POST',
      originalUrl: '/api/payouts/flutterwave/withdraw',
    };
    const res = mockRes();
    const next = vi.fn();

    await requireBusinessPermission('accounts.withdraw')(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.body).toMatchObject({ success: false, code: 'BUSINESS_PERMISSION_REQUIRED', permission: 'accounts.withdraw' });
  });

  it('blocks a staff sub-account with no permissions at all', async () => {
    const req = {
      user: { id: 'owner-1' },
      actingStaff: { id: 'staff-1', permissions: [] },
      get: () => 'test-agent',
    };
    const res = mockRes();
    const next = vi.fn();

    await requireBusinessPermission('chats.manage')(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(403);
  });
});
