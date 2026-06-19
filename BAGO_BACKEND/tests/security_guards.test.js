import { describe, it, expect, vi } from 'vitest';
import { requireInternalWalletMutation, requireVerifiedContact } from '../middleware/securityGuards.js';

function mockResponse() {
  return {
    statusCode: 200,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      return this;
    },
  };
}

describe('security guards', () => {
  it('blocks wallet/payout access until email and phone are verified', () => {
    const req = { user: { id: 'user-1', email_verified: true, phone_verified: false } };
    const res = mockResponse();
    const next = vi.fn();

    requireVerifiedContact(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.statusCode).toBe(403);
    expect(res.body.code).toBe('CONTACT_VERIFICATION_REQUIRED');
  });

  it('allows wallet/payout access after contact verification', () => {
    const req = { user: { id: 'user-1', email_verified: true, phone_verified: true } };
    const res = mockResponse();
    const next = vi.fn();

    requireVerifiedContact(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(res.statusCode).toBe(200);
  });

  it('blocks direct client-side wallet mutations without the internal secret', () => {
    const req = { headers: {} };
    const res = mockResponse();
    const next = vi.fn();

    requireInternalWalletMutation(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.statusCode).toBe(403);
    expect(res.body.code).toBe('DIRECT_WALLET_MUTATION_BLOCKED');
  });
});
