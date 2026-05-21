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
