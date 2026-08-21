import { beforeEach, describe, expect, it, vi } from 'vitest';

// BusinessOnboardingController pulls in PremblyController.js at module load
// (for adminGenerateKycLink), which has its own heavy transitive imports —
// stub it out since neither function under test here calls it.
vi.mock('../controllers/PremblyController.js', () => ({
  createPremblySessionForUser: vi.fn(),
}));

const mocks = vi.hoisted(() => ({
  query: vi.fn().mockResolvedValue({ rows: [], rowCount: 0 }),
  queryOne: vi.fn(),
  createProfileWithWallet: vi.fn(),
  findProfileById: vi.fn(),
  sendAdminCreatedBusinessAccountEmail: vi.fn().mockResolvedValue(true),
  sendBusinessWelcomeEmail: vi.fn().mockResolvedValue(true),
  sendKycVerificationLinkEmail: vi.fn().mockResolvedValue(true),
}));

vi.mock('../lib/postgres/db.js', () => ({
  query: mocks.query,
  queryOne: mocks.queryOne,
}));

vi.mock('../lib/postgres/profiles.js', () => ({
  createProfileWithWallet: mocks.createProfileWithWallet,
  findProfileById: mocks.findProfileById,
}));

vi.mock('../services/emailNotifications.js', () => ({
  sendAdminCreatedBusinessAccountEmail: mocks.sendAdminCreatedBusinessAccountEmail,
  sendBusinessWelcomeEmail: mocks.sendBusinessWelcomeEmail,
  sendKycVerificationLinkEmail: mocks.sendKycVerificationLinkEmail,
}));

import { createBusinessAccount, approveBusinessAccount } from '../controllers/AdminControllers/BusinessOnboardingController.js';

function mockRes() {
  const res = { _code: null, _body: null };
  res.status = (code) => { res._code = code; return res; };
  res.json = (body) => { res._body = body; return res; };
  return res;
}

describe('admin-created business account flow', () => {
  beforeEach(() => {
    mocks.query.mockReset().mockResolvedValue({ rows: [], rowCount: 0 });
    mocks.queryOne.mockReset();
    mocks.createProfileWithWallet.mockReset();
    mocks.findProfileById.mockReset();
    mocks.sendAdminCreatedBusinessAccountEmail.mockReset().mockResolvedValue(true);
    mocks.sendBusinessWelcomeEmail.mockReset().mockResolvedValue(true);
  });

  it('creates the account as a company with mustChangePassword set, and emails a temp password', async () => {
    mocks.createProfileWithWallet.mockResolvedValue({ id: 'biz-1', email: 'ops@acme.test' });
    const req = {
      body: {
        companyName: 'Acme Logistics Ltd', tradingName: 'Acme Express', businessRegistrationNumber: 'RC-1',
        firstName: 'Ada', lastName: 'Cole', email: 'ops@acme.test', country: 'NG',
      },
    };
    const res = mockRes();
    await createBusinessAccount(req, res, vi.fn());

    expect(mocks.createProfileWithWallet).toHaveBeenCalledOnce();
    const createArgs = mocks.createProfileWithWallet.mock.calls[0][0];
    expect(createArgs).toMatchObject({ accountType: 'company', signupMethod: 'admin_created', mustChangePassword: true });
    // No grace period is stamped at creation for admin-created accounts —
    // it only starts once the temp password is changed (see
    // userController.js#changePassword) — the caller is responsible for
    // not passing a grace-period timestamp here.
    expect(createArgs.businessGracePeriodStartedAt).toBeUndefined();

    expect(res._code).toBe(201);
    expect(mocks.sendAdminCreatedBusinessAccountEmail).toHaveBeenCalledWith(
      'ops@acme.test', 'Ada Cole', 'Acme Express', expect.any(String),
    );
  });

  it('rejects account creation when required fields are missing', async () => {
    const req = { body: { companyName: 'Acme' } };
    const res = mockRes();
    await createBusinessAccount(req, res, vi.fn());
    expect(res._code).toBe(400);
    expect(mocks.createProfileWithWallet).not.toHaveBeenCalled();
  });
});

describe('admin approval gate (approveBusinessAccount)', () => {
  beforeEach(() => {
    mocks.query.mockReset().mockResolvedValue({ rows: [], rowCount: 0 });
    mocks.findProfileById.mockReset();
    mocks.sendBusinessWelcomeEmail.mockReset().mockResolvedValue(true);
  });

  it('refuses to approve when representative KYC has not been approved yet', async () => {
    mocks.findProfileById.mockResolvedValue({
      id: 'biz-1', accountType: 'company', kycStatus: 'pending', businessDocumentStatus: 'approved',
    });
    const req = { params: { userId: 'biz-1' } };
    const res = mockRes();
    await approveBusinessAccount(req, res, vi.fn());

    expect(res._code).toBe(400);
    expect(mocks.query).not.toHaveBeenCalled();
    expect(mocks.sendBusinessWelcomeEmail).not.toHaveBeenCalled();
  });

  it('refuses to approve when the CAC/business document has not been approved yet', async () => {
    mocks.findProfileById.mockResolvedValue({
      id: 'biz-1', accountType: 'company', kycStatus: 'approved', businessDocumentStatus: 'pending_review',
    });
    const req = { params: { userId: 'biz-1' } };
    const res = mockRes();
    await approveBusinessAccount(req, res, vi.fn());

    expect(res._code).toBe(400);
    expect(mocks.query).not.toHaveBeenCalled();
  });

  it('approves and lifts restrictions once both representative KYC and the business document are approved', async () => {
    mocks.findProfileById.mockResolvedValue({
      id: 'biz-1', accountType: 'company', kycStatus: 'approved', businessDocumentStatus: 'approved',
      firstName: 'Ada', lastName: 'Cole', tradingName: 'Acme Express', email: 'ops@acme.test',
    });
    const req = { params: { userId: 'biz-1' } };
    const res = mockRes();
    await approveBusinessAccount(req, res, vi.fn());

    expect(mocks.query).toHaveBeenCalledWith(
      expect.stringContaining("business_status = 'verified'"),
      ['biz-1'],
    );
    expect(res._code).toBe(200);
    expect(mocks.sendBusinessWelcomeEmail).toHaveBeenCalledWith('ops@acme.test', 'Ada Cole', 'Acme Express');
  });

  it('rejects approval for a non-business (individual) account', async () => {
    mocks.findProfileById.mockResolvedValue({ id: 'user-1', accountType: 'individual' });
    const req = { params: { userId: 'user-1' } };
    const res = mockRes();
    await approveBusinessAccount(req, res, vi.fn());
    expect(res._code).toBe(400);
  });
});
