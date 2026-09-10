import { describe, it, expect } from 'vitest';
import { validateLegalName } from '../services/securityService.js';
import { applyReactivationToUser } from '../controllers/postgresUserController.js';

describe('validateLegalName — softened rules', () => {
  it('accepts a single-token legal name (mononym / collapsed OAuth name)', () => {
    expect(validateLegalName('Aleksander').valid).toBe(true);
    expect(validateLegalName('Sukarno').valid).toBe(true);
  });

  it('still accepts normal two-part names, including short and accented', () => {
    expect(validateLegalName('John Doe').valid).toBe(true);
    expect(validateLegalName('Al Bo').valid).toBe(true);
    expect(validateLegalName('María José').valid).toBe(true);
  });

  it('still rejects junk', () => {
    expect(validateLegalName('J').valid).toBe(false); // too short
    expect(validateLegalName('').valid).toBe(false);
    expect(validateLegalName('test').valid).toBe(false); // fake-name list
    expect(validateLegalName('John5 Doe').valid).toBe(false); // digits
    expect(validateLegalName('John_Doe').valid).toBe(false); // underscore
    expect(validateLegalName('aaaa').valid).toBe(false); // repeated chars
  });
});

describe('applyReactivationToUser', () => {
  it('resets identity/KYC state on an approved account being reactivated', () => {
    const user = {
      is_active: false,
      kycStatus: 'approved',
      kyc_status: 'approved',
      phoneVerified: true,
      phone_verified: true,
      identity_fields_locked: true,
    };
    applyReactivationToUser(user);
    expect(user.is_active).toBe(true);
    expect(user.needsFreshDetails).toBe(true);
    expect(user.needs_fresh_details).toBe(true);
    expect(user.kycStatus).toBe('not_started');
    expect(user.kyc_status).toBe('not_started');
    expect(user.phoneVerified).toBe(false);
    expect(user.phone_verified).toBe(false);
    expect(user.identityFieldsLocked).toBe(false);
  });

  it('does not downgrade a non-approved kyc status', () => {
    const user = { kycStatus: 'pending', kyc_status: 'pending' };
    applyReactivationToUser(user);
    expect(user.kycStatus).toBe('pending');
    expect(user.needsFreshDetails).toBe(true);
  });
});
