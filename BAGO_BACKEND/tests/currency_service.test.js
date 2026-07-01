import { beforeEach, describe, expect, it, vi } from 'vitest';

let exchangeRateRow = null;
const queryMock = vi.fn(async () => ({ rows: [] }));
const queryOneMock = vi.fn(async (sql) => {
  if (String(sql).includes('from public.exchange_rates')) return exchangeRateRow;
  return null;
});

vi.mock('../lib/postgres/db.js', () => ({
  query: queryMock,
  queryOne: queryOneMock,
}));

const { CurrencyService } = await import('../services/currencyConverter.js');

describe('CurrencyService cached conversion', () => {
  beforeEach(() => {
    exchangeRateRow = null;
    queryMock.mockClear();
    queryOneMock.mockClear();
  });

  it('blocks conversion when cached rates are missing', async () => {
    await expect(CurrencyService.convertMoney(1000, 'EUR', 'NGN')).rejects.toMatchObject({
      code: 'EXCHANGE_RATE_MISSING',
      statusCode: 503,
    });
  });

  it('blocks conversion when cached rates are expired', async () => {
    exchangeRateRow = {
      base_currency: 'USD',
      rates: { USD: 1, EUR: 0.9, NGN: 1500 },
      source: 'test',
      last_updated: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
      expires_at: new Date(Date.now() - 60 * 1000).toISOString(),
    };

    await expect(CurrencyService.convertMoney(1000, 'EUR', 'NGN')).rejects.toMatchObject({
      code: 'EXCHANGE_RATE_EXPIRED',
      statusCode: 503,
    });
  });

  it('converts using latest valid cached rates and records audit metadata', async () => {
    exchangeRateRow = {
      base_currency: 'USD',
      rates: { USD: 1, EUR: 0.9, NGN: 1500 },
      source: 'test-provider',
      last_updated: new Date().toISOString(),
      expires_at: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
    };

    const converted = await CurrencyService.convertMoney(1000, 'EUR', 'NGN', {
      context: { test: true },
    });

    expect(converted).toMatchObject({
      amount_minor: 1666667,
      currency: 'NGN',
      original_amount_minor: 1000,
      original_currency: 'EUR',
      exchange_rate_source: 'test-provider',
    });
    expect(queryMock).toHaveBeenCalledWith(
      expect.stringContaining('currency_conversion_audit_logs'),
      expect.arrayContaining(['EUR', 'NGN', 1000, 1666667]),
    );
  });

  it('formats money from minor units', () => {
    expect(CurrencyService.formatMoney(12345, 'USD')).toBe('$123.45');
  });
});
