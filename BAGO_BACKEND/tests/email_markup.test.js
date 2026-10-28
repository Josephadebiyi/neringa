import { beforeEach, describe, expect, it, vi } from 'vitest';

const send = vi.hoisted(() => vi.fn(async () => ({ data: { id: 'email-1' } })));
vi.mock('../services/resendClient.js', () => ({ resend: { emails: { send } } }));

import { sendNewRequestToTravelerEmail, sendWithdrawalAdminNotification } from '../services/emailNotifications.js';

beforeEach(() => send.mockClear());

describe('user-written text in emails', () => {
  it('cannot inject markup into an email sent to another user', async () => {
    await sendNewRequestToTravelerEmail(
      'traveller@example.com', 'Tom',
      '<a href="https://evil.example">Verify your account</a>', 'Shoes <img src=x onerror=alert(1)>',
      { fromLocation: 'Lagos', toLocation: '<b>Madrid</b>', departureDate: '2026-11-02' }, 'req-1',
    );
    const { html, to } = send.mock.calls[0][0];
    expect(to).toBe('traveller@example.com');
    expect(html).not.toContain('<a href="https://evil.example">');
    expect(html).not.toContain('<img src=x');
    expect(html).not.toContain('<b>Madrid</b>');
    expect(html).toContain('&lt;a href=&quot;https://evil.example&quot;&gt;');
  });

  it('keeps plain names readable in admin payout emails', async () => {
    await sendWithdrawalAdminNotification('ops@example.com', {
      userName: "Ana O'Brien & Co", userEmail: 'ana@example.com', amount: 100, currency: 'EUR', method: 'Bank transfer', reference: 'BAGO-WD-1',
    });
    const { html, subject } = send.mock.calls[0][0];
    expect(html).toContain("Ana O'Brien & Co");
    expect(subject).toBe('💸 Withdrawal Request — EUR 100.00 via Bank transfer');
  });
});
