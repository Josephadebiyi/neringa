import { describe, it, expect, vi } from 'vitest';
import { requireKycVerification } from '../middleware/kycMiddleware.js';

function mockRes() {
  const res = { _code: null, _body: null };
  res.status = (code) => { res._code = code; return res; };
  res.json = (body) => { res._body = body; return res; };
  return res;
}

describe('requireKycVerification middleware', () => {
  it('blocks unauthenticated requests (no req.user)', () => {
    const req = {};
    const res = mockRes();
    const next = vi.fn();
    requireKycVerification(req, res, next);
    expect(res._code).toBe(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('blocks user with kycStatus = null', () => {
    const req = { user: { id: 'u1', kycStatus: null } };
    const res = mockRes();
    const next = vi.fn();
    requireKycVerification(req, res, next);
    expect(res._code).toBe(403);
    expect(res._body.code).toBe('VERIFICATION_REQUIRED');
    expect(next).not.toHaveBeenCalled();
  });

  it('blocks user with kycStatus = "pending"', () => {
    const req = { user: { id: 'u1', kycStatus: 'pending' } };
    const res = mockRes();
    const next = vi.fn();
    requireKycVerification(req, res, next);
    expect(res._code).toBe(403);
    expect(res._body.kycStatus).toBe('pending');
    expect(next).not.toHaveBeenCalled();
  });

  it('blocks user with kycStatus = "manual_review" (not yet admin-approved)', () => {
    const req = { user: { id: 'u1', kycStatus: 'manual_review' } };
    const res = mockRes();
    const next = vi.fn();
    requireKycVerification(req, res, next);
    expect(res._code).toBe(403);
    expect(res._body.kycStatus).toBe('manual_review');
    expect(next).not.toHaveBeenCalled();
  });

  it('blocks user with kycStatus = "failed_verification"', () => {
    const req = { user: { id: 'u1', kycStatus: 'failed_verification' } };
    const res = mockRes();
    const next = vi.fn();
    requireKycVerification(req, res, next);
    expect(res._code).toBe(403);
    expect(next).not.toHaveBeenCalled();
  });

  it('passes Dojah-approved user (kycStatus = "approved")', () => {
    const req = { user: { id: 'u1', kycStatus: 'approved', kycProvider: 'dojah' } };
    const res = mockRes();
    const next = vi.fn();
    requireKycVerification(req, res, next);
    expect(next).toHaveBeenCalledOnce();
    expect(res._code).toBeNull();
  });

  it('passes manually admin-approved user (kycStatus = "approved", kycProvider = "manual")', () => {
    const req = { user: { id: 'u1', kycStatus: 'approved', kycProvider: 'manual' } };
    const res = mockRes();
    const next = vi.fn();
    requireKycVerification(req, res, next);
    expect(next).toHaveBeenCalledOnce();
    expect(res._code).toBeNull();
  });

  it('includes current kycStatus in the 403 response body', () => {
    const req = { user: { id: 'u1', kycStatus: 'manual_review' } };
    const res = mockRes();
    const next = vi.fn();
    requireKycVerification(req, res, next);
    expect(res._body).toMatchObject({
      success: false,
      code: 'VERIFICATION_REQUIRED',
      kycStatus: 'manual_review',
    });
  });
});

describe('requireKycVerification — business grace period', () => {
  const hoursAgo = (h) => new Date(Date.now() - h * 60 * 60 * 1000).toISOString();
  const daysAgo = (d) => new Date(Date.now() - d * 24 * 60 * 60 * 1000).toISOString();

  it('bypasses the KYC gate entirely while a company account is inside its 14-day grace period (self-signup, unverified KYC)', () => {
    const req = {
      user: {
        id: 'biz1', accountType: 'company', businessStatus: 'representative_kyc_required',
        businessGracePeriodStartedAt: hoursAgo(1), kycStatus: null,
      },
    };
    const res = mockRes();
    const next = vi.fn();
    requireKycVerification(req, res, next);
    expect(next).toHaveBeenCalledOnce();
    expect(res._code).toBeNull();
  });

  it('bypasses the KYC gate for an admin-created business account whose grace period started at first login', () => {
    const req = {
      user: {
        id: 'biz2', accountType: 'company', signupMethod: 'admin_created',
        businessStatus: 'pending_review', businessGracePeriodStartedAt: daysAgo(3), kycStatus: null,
      },
    };
    const res = mockRes();
    const next = vi.fn();
    requireKycVerification(req, res, next);
    expect(next).toHaveBeenCalledOnce();
  });

  it('blocks with BUSINESS_ACCOUNT_RESTRICTED once the grace period has expired without admin approval', () => {
    const req = {
      user: {
        id: 'biz3', accountType: 'company', businessStatus: 'pending_review',
        businessGracePeriodStartedAt: daysAgo(15), kycStatus: null,
      },
    };
    const res = mockRes();
    const next = vi.fn();
    requireKycVerification(req, res, next);
    expect(next).not.toHaveBeenCalled();
    expect(res._code).toBe(403);
    expect(res._body.code).toBe('BUSINESS_ACCOUNT_RESTRICTED');
  });

  it('does not apply the grace-period bypass to a company account that has not logged in yet (no grace period start)', () => {
    const req = {
      user: {
        id: 'biz4', accountType: 'company', businessStatus: 'not_started',
        businessGracePeriodStartedAt: null, kycStatus: null,
      },
    };
    const res = mockRes();
    const next = vi.fn();
    requireKycVerification(req, res, next);
    expect(next).not.toHaveBeenCalled();
    expect(res._code).toBe(403);
    expect(res._body.code).toBe('VERIFICATION_REQUIRED');
  });

  it('falls through to the normal KYC check once a business is admin-approved, and passes since KYC is approved', () => {
    const req = {
      user: {
        id: 'biz5', accountType: 'company', businessStatus: 'verified',
        businessGracePeriodStartedAt: daysAgo(200), kycStatus: 'approved',
      },
    };
    const res = mockRes();
    const next = vi.fn();
    requireKycVerification(req, res, next);
    expect(next).toHaveBeenCalledOnce();
  });
});
