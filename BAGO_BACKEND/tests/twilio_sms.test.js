import { afterEach, beforeEach, expect, it, vi } from 'vitest';
vi.mock('twilio', () => ({ default: vi.fn(() => ({ messages: { create: vi.fn() } })) }));
import { getTwilioClient } from '../services/twilioSmsService.js';
beforeEach(() => {
  vi.stubEnv('TWILIO_ACCOUNT_SID', 'ACtest');
  vi.stubEnv('TWILIO_AUTH_TOKEN', 'test-token');
  vi.stubEnv('TWILIO_FROM_NUMBER', 'BAGO');
  vi.stubEnv('TWILIO_MESSAGING_SERVICE_SID', '');
});
afterEach(() => vi.unstubAllEnvs());
it('delegates sender selection to the service without forcing BAGO', () => {
  vi.stubEnv('TWILIO_MESSAGING_SERVICE_SID', 'MGtest');
  expect(getTwilioClient().senderOptions).toEqual({ messagingServiceSid: 'MGtest' });
});
it('can send through the service without a fixed sender configured', () => {
  vi.stubEnv('TWILIO_MESSAGING_SERVICE_SID', 'MGtest');
  vi.stubEnv('TWILIO_FROM_NUMBER', '');
  expect(getTwilioClient().senderOptions).toEqual({ messagingServiceSid: 'MGtest' });
});
it('preserves direct sending until the service is configured', () => {
  expect(getTwilioClient().senderOptions).toEqual({ from: 'BAGO' });
});
it('does not create a client with incomplete credentials', () => {
  vi.stubEnv('TWILIO_AUTH_TOKEN', '');
  expect(getTwilioClient()).toBeNull();
});
