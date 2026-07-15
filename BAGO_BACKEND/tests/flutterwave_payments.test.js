import { beforeEach, describe, expect, it, vi } from 'vitest';

const queryMock = vi.fn(async () => ({ rows: [] }));
const queryOneMock = vi.fn(async () => ({ id: 'payment-id' }));

vi.mock('../lib/postgres/db.js', () => ({
  query: queryMock,
  queryOne: queryOneMock,
  withTransaction: vi.fn(),
}));

const { recordPaymentInitiated } =
  await import('../lib/postgres/flutterwavePayments.js');

describe('Flutterwave payment persistence', () => {
  beforeEach(() => {
    queryMock.mockClear();
    queryOneMock.mockClear();
  });

  it('matches the production partial unique index during upsert', async () => {
    await recordPaymentInitiated({
      provider: 'flutterwave',
      providerReference: 'BAGO-PAY-TEST',
      userId: 'e75e0376-a9ca-4afa-9376-2a5896fa27c4',
      amount: 10,
      currency: 'EUR',
    });

    expect(queryOneMock).toHaveBeenCalledWith(
      expect.stringMatching(
        /on conflict \(provider, provider_reference\)\s+where provider_reference is not null\s+do update/i,
      ),
      expect.arrayContaining(['flutterwave', 'BAGO-PAY-TEST', 10, 'EUR']),
    );
  });
});
