import { describe, expect, it, vi, beforeAll } from 'vitest';

vi.mock('../lib/postgres/db.js', () => ({ query: vi.fn(), queryOne: vi.fn(), withTransaction: vi.fn() }));
vi.mock('../services/aiService.js', () => ({ askClaude: vi.fn(), isAiEnabled: () => false }));
vi.mock('../controllers/AdminControllers/setting.js', () => ({
  getAppSettings: async () => ({ chatModerationEnabled: true, chatAiModerationEnabled: false, chatWarningsBeforeLock: 1 }),
}));

beforeAll(() => { process.env.JWT_SECRET = 'test-secret'; });

describe('chat warning limit', () => {
  it('never locks before 2 warnings and defaults to 3', async () => {
    const { clampWarningLimit } = await import('../services/chatPolicyLimits.js');
    expect(clampWarningLimit(1)).toBe(2);
    expect(clampWarningLimit(undefined)).toBe(3);
    expect(clampWarningLimit(50)).toBe(10);
  });

  it('treats an old saved setting of 1 as 2', async () => {
    const { classifyChatMessage } = await import('../services/chatPolicyService.js');
    const r = await classifyChatMessage('call me on +234 803 123 4567');
    expect(r.flagged).toBe(true);
    expect(r.warningLimit).toBe(2);
  });
});

describe('phone number detection', () => {
  it('ignores prices, weights and dates', async () => {
    const { classifyChatMessage } = await import('../services/chatPolicyService.js');
    for (const text of ['The fee is 25,000.00 naira', 'Bag is 12.5 kg, flying 2026-11-04', 'Flight BA 0075 at 10:30']) {
      expect((await classifyChatMessage(text)).flagged).toBe(false);
    }
  });

  it('flags real phone numbers', async () => {
    const { classifyChatMessage } = await import('../services/chatPolicyService.js');
    expect((await classifyChatMessage('my number is 08031234567')).flagged).toBe(true);
  });
});

describe('admin email action tokens', () => {
  it('round-trips and rejects tampering or expiry', async () => {
    const { createChatActionToken, verifyChatActionToken } = await import('../services/chatModerationActions.js');
    const now = Date.now();
    const token = createChatActionToken({ conversationId: 'c1', adminEmail: 'a@b.com', action: 'unlock', now });
    expect(verifyChatActionToken(token, now)).toMatchObject({ conversationId: 'c1', adminEmail: 'a@b.com', action: 'unlock' });

    const [payload, sig] = token.split('.');
    const forged = Buffer.from(JSON.stringify({ c: 'c1', e: 'a@b.com', a: 'keep_locked', x: now + 1e9 })).toString('base64url');
    expect(verifyChatActionToken(`${forged}.${sig}`, now)).toBeNull();
    expect(verifyChatActionToken(`${payload}.x${sig.slice(1)}`, now)).toBeNull();
    expect(verifyChatActionToken(token, now + 8 * 24 * 3600 * 1000)).toBeNull();
  });
});
