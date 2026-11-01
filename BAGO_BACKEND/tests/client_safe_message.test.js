import { describe, expect, it, vi } from 'vitest';
import {
  DEFAULT_CLIENT_ERROR,
  fallbackMessageForPath,
  isTechnicalMessage,
  sanitizeClientErrorPayload,
} from '../utils/clientSafeMessage.js';

describe('isTechnicalMessage', () => {
  it.each([
    'Please enable IP Whitelisting to access this service',
    'Invalid authorization key',
    'Flutterwave secret key not configured',
    'Request failed with status code 401',
    'connect ECONNREFUSED 127.0.0.1:5432',
    'timeout of 20000ms exceeded',
    "Cannot read properties of undefined (reading 'id')",
    'relation "public.profiles" does not exist',
    'duplicate key value violates unique constraint "profiles_email_key"',
    'invalid input syntax for type uuid: "abc"',
    'jwt malformed',
    'SUPABASE_DB_URL is not configured.',
    'TypeError: x is not a function',
    'Unexpected token < in JSON at position 0',
    'Error\n    at Object.<anonymous> (/app/server.js:12:3)',
    'Insufficient funds in your Stripe balance',
  ])('flags %j', (text) => {
    expect(isTechnicalMessage(text)).toBe(true);
  });

  it.each([
    'Insufficient balance',
    'Invalid credentials',
    'This trip does not have enough space left',
    'Email already registered',
    'Please enter a valid amount.',
    'Your verification code has expired. Request a new one.',
    'Withdrawal OTP is invalid.',
    'Only the traveler on this trip can perform this action.',
    'Your Stripe Express account is not complete yet. Please continue to accept Stripe terms, confirm your identity, and add your bank account.',
    'Please select a supported payout currency.',
  ])('keeps %j', (text) => {
    expect(isTechnicalMessage(text)).toBe(false);
  });
});

describe('fallbackMessageForPath', () => {
  it('uses a withdrawal-specific message that reassures about the balance', () => {
    expect(fallbackMessageForPath('/api/payouts/flutterwave/withdraw')).toMatch(/balance has not been affected/);
  });

  it('falls back to a generic message for unknown endpoints', () => {
    expect(fallbackMessageForPath('/api/bago/trips')).toBe(DEFAULT_CLIENT_ERROR);
  });
});

describe('sanitizeClientErrorPayload', () => {
  it('replaces the provider message the withdraw screen used to show', () => {
    const onReplace = vi.fn();
    const out = sanitizeClientErrorPayload(
      { success: false, message: 'Please enable IP Whitelisting to access this service' },
      { path: '/api/payouts/flutterwave/withdraw', onReplace },
    );
    expect(out).toEqual({
      success: false,
      message: "We couldn't process your withdrawal right now. Your balance has not been affected. Please try again later.",
    });
    expect(onReplace).toHaveBeenCalledWith('message', 'Please enable IP Whitelisting to access this service');
  });

  it('keeps deliberate validation messages and codes untouched', () => {
    const payload = { success: false, code: 'INSUFFICIENT_BALANCE', message: 'Insufficient balance' };
    expect(sanitizeClientErrorPayload(payload, { path: '/api/payouts/flutterwave/withdraw' })).toEqual(payload);
  });

  it('drops raw error objects and stacks but still gives the app a message', () => {
    const out = sanitizeClientErrorPayload(
      { success: false, error: { status: 'error', message: 'Invalid authorization key' }, stack: 'Error at x.js:1' },
      { path: '/api/bago/kyc/status' },
    );
    expect(out).toEqual({ success: false, message: "We couldn't complete verification right now. Please try again shortly." });
  });

  it('removes a technical `error` string when a friendly `message` is present', () => {
    const out = sanitizeClientErrorPayload(
      { message: 'Could not save trip.', error: 'null value in column "user_id" violates not-null constraint' },
      { path: '/api/bago/AddTrip' },
    );
    expect(out).toEqual({ message: 'Could not save trip.' });
  });
});
