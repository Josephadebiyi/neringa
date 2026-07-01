import fetch from 'node-fetch';

import { query, queryOne } from '../lib/postgres/db.js';
import {
  DEFAULT_COMMISSION_RATE,
  getFullPricingConfig,
  calculateAllInclusivePrice,
} from './pricingService.js';

const DEFAULT_MAX_RATE_AGE_MINUTES = Number(process.env.EXCHANGE_RATE_MAX_AGE_MINUTES || 720);
const DEFAULT_BASE_CURRENCY = 'USD';
const PLATFORM_COMMISSION_RATE = DEFAULT_COMMISSION_RATE;

const SUPPORTED_CURRENCIES = new Set([
  'USD', 'EUR', 'GBP', 'NGN', 'GHS', 'KES', 'ZAR', 'CAD', 'AUD', 'JPY',
  'CNY', 'INR', 'BRL', 'MXN', 'CHF', 'SEK', 'NOK', 'DKK', 'SGD', 'HKD',
  'AED', 'SAR', 'QAR', 'KWD', 'PKR', 'BDT', 'LKR', 'EGP', 'MAD', 'TND',
  'RWF', 'UGX', 'TZS', 'XOF', 'XAF', 'ETB', 'MZN', 'ZMW',
]);

const ZERO_DECIMAL_CURRENCIES = new Set([
  'BIF', 'CLP', 'DJF', 'GNF', 'ISK', 'JPY', 'KMF', 'KRW', 'PYG', 'RWF',
  'UGX', 'VND', 'VUV', 'XAF', 'XOF', 'XPF',
]);

const THREE_DECIMAL_CURRENCIES = new Set(['BHD', 'JOD', 'KWD', 'OMR', 'TND']);

function assertInteger(value, name) {
  if (!Number.isSafeInteger(value)) {
    throw new Error(`${name} must be a safe integer minor-unit amount.`);
  }
}

function toJson(value) {
  return JSON.stringify(value ?? {});
}

function nowIso() {
  return new Date().toISOString();
}

function rateExpiry(lastUpdated, maxAgeMinutes = DEFAULT_MAX_RATE_AGE_MINUTES) {
  return new Date(new Date(lastUpdated).getTime() + maxAgeMinutes * 60 * 1000);
}

function decimalToRatio(decimal, precision = 12) {
  const fixed = Number(decimal).toFixed(precision);
  const [whole, fraction = ''] = fixed.replace(/0+$/, '').replace(/\.$/, '').split('.');
  const denominator = 10 ** fraction.length;
  const numerator = Number(whole || 0) * denominator + Number(fraction || 0);
  return { numerator, denominator };
}

function multiplyRatioRound(amountMinor, ratio) {
  assertInteger(amountMinor, 'amountMinor');
  const numerator = BigInt(Math.round(ratio.numerator));
  const denominator = BigInt(Math.round(ratio.denominator));
  const raw = BigInt(amountMinor) * numerator;
  const rounded = (raw + denominator / 2n) / denominator;
  const asNumber = Number(rounded);
  if (!Number.isSafeInteger(asNumber)) {
    throw new Error('Converted amount exceeds safe integer range.');
  }
  return asNumber;
}

async function ensureCurrencyInfrastructure() {
  await query(`
    create table if not exists public.exchange_rates (
      base_currency text primary key,
      rates jsonb not null default '{}'::jsonb,
      source text not null default 'unknown',
      last_updated timestamptz not null default timezone('utc', now()),
      expires_at timestamptz,
      created_at timestamptz not null default timezone('utc', now()),
      updated_at timestamptz not null default timezone('utc', now())
    )
  `);
  await query(`
    alter table public.exchange_rates
      add column if not exists source text not null default 'unknown',
      add column if not exists expires_at timestamptz,
      add column if not exists created_at timestamptz not null default timezone('utc', now()),
      add column if not exists updated_at timestamptz not null default timezone('utc', now())
  `);
  await query(`
    create table if not exists public.exchange_rate_logs (
      id bigserial primary key,
      provider text not null,
      base_currency text not null,
      status text not null,
      message text,
      payload jsonb not null default '{}'::jsonb,
      created_at timestamptz not null default timezone('utc', now())
    )
  `);
  await query(`
    create table if not exists public.currency_conversion_audit_logs (
      id bigserial primary key,
      from_currency text not null,
      to_currency text not null,
      amount_minor bigint not null,
      converted_amount_minor bigint not null,
      exchange_rate numeric(24,12) not null,
      exchange_rate_source text not null,
      exchange_rate_timestamp timestamptz not null,
      context jsonb not null default '{}'::jsonb,
      created_at timestamptz not null default timezone('utc', now())
    )
  `);
}

const exchangeRateProviders = [
  {
    name: 'frankfurter',
    async fetch(baseCurrency) {
      const response = await fetch(`https://api.frankfurter.app/latest?from=${baseCurrency}`, { timeout: 10000 });
      if (!response.ok) throw new Error(`Frankfurter responded ${response.status}`);
      const data = await response.json();
      return data?.rates ? { rates: { ...data.rates, [baseCurrency]: 1 }, asOf: data.date } : null;
    },
  },
  {
    name: 'open.er-api.com',
    async fetch(baseCurrency) {
      const response = await fetch(`https://open.er-api.com/v6/latest/${baseCurrency}`, { timeout: 10000 });
      if (!response.ok) throw new Error(`open.er-api.com responded ${response.status}`);
      const data = await response.json();
      return data?.rates ? { rates: data.rates, asOf: data.time_last_update_utc } : null;
    },
  },
];

export class CurrencyService {
  static normalizeCurrency(code) {
    const normalized = String(code || '').trim().toUpperCase();
    if (!/^[A-Z]{3}$/.test(normalized)) {
      throw new Error(`Invalid currency code: ${code || ''}`);
    }
    return normalized;
  }

  static getMinorUnitMultiplier(currency) {
    const normalized = CurrencyService.normalizeCurrency(currency);
    if (ZERO_DECIMAL_CURRENCIES.has(normalized)) return 1;
    if (THREE_DECIMAL_CURRENCIES.has(normalized)) return 1000;
    return 100;
  }

  static majorToMinor(amount, currency) {
    const multiplier = CurrencyService.getMinorUnitMultiplier(currency);
    const numeric = Number(amount);
    if (!Number.isFinite(numeric)) throw new Error('Amount must be numeric.');
    return Math.round(numeric * multiplier);
  }

  static minorToMajor(amountMinor, currency) {
    assertInteger(Number(amountMinor), 'amountMinor');
    return Number(amountMinor) / CurrencyService.getMinorUnitMultiplier(currency);
  }

  static formatMoney(amountMinor, currency, locale = 'en-US') {
    const normalized = CurrencyService.normalizeCurrency(currency);
    const amount = CurrencyService.minorToMajor(Number(amountMinor), normalized);
    try {
      return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: normalized,
      }).format(amount);
    } catch {
      return `${normalized} ${amount.toFixed(CurrencyService.getMinorUnitMultiplier(normalized) === 1 ? 0 : 2)}`;
    }
  }

  static async refreshRates({ baseCurrency = DEFAULT_BASE_CURRENCY, maxAgeMinutes = DEFAULT_MAX_RATE_AGE_MINUTES } = {}) {
    await ensureCurrencyInfrastructure();
    const base = CurrencyService.normalizeCurrency(baseCurrency);
    const errors = [];

    for (const provider of exchangeRateProviders) {
      try {
        const result = await provider.fetch(base);
        const rates = result?.rates || {};
        const cleanRates = Object.fromEntries(
          Object.entries(rates)
            .map(([code, value]) => [String(code).toUpperCase(), Number(value)])
            .filter(([code, value]) => /^[A-Z]{3}$/.test(code) && Number.isFinite(value) && value > 0),
        );
        cleanRates[base] = 1;
        if (Object.keys(cleanRates).length < 3) {
          throw new Error('Provider returned too few valid rates.');
        }

        const timestamp = result?.asOf ? new Date(result.asOf) : new Date();
        const validTimestamp = Number.isNaN(timestamp.getTime()) ? new Date() : timestamp;
        await queryOne(
          `
            insert into public.exchange_rates (base_currency, rates, source, last_updated, expires_at, updated_at)
            values ($1, $2::jsonb, $3, $4, $5, timezone('utc', now()))
            on conflict (base_currency)
            do update set rates = excluded.rates,
                          source = excluded.source,
                          last_updated = excluded.last_updated,
                          expires_at = excluded.expires_at,
                          updated_at = excluded.updated_at
            returning base_currency
          `,
          [
            base,
            toJson(cleanRates),
            provider.name,
            validTimestamp.toISOString(),
            rateExpiry(validTimestamp, maxAgeMinutes).toISOString(),
          ],
        );
        await query(
          `insert into public.exchange_rate_logs (provider, base_currency, status, message, payload)
           values ($1,$2,'success',$3,$4::jsonb)`,
          [provider.name, base, `Stored ${Object.keys(cleanRates).length} rates`, toJson({ asOf: result?.asOf || null })],
        );
        return { baseCurrency: base, rates: cleanRates, source: provider.name, timestamp: validTimestamp.toISOString() };
      } catch (error) {
        errors.push(`${provider.name}: ${error.message}`);
        await query(
          `insert into public.exchange_rate_logs (provider, base_currency, status, message, payload)
           values ($1,$2,'failed',$3,$4::jsonb)`,
          [provider.name, base, error.message, toJson({})],
        ).catch(() => {});
      }
    }

    throw new Error(`Exchange rate refresh failed: ${errors.join('; ')}`);
  }

  static async getCachedRates({ baseCurrency = DEFAULT_BASE_CURRENCY, maxAgeMinutes = DEFAULT_MAX_RATE_AGE_MINUTES } = {}) {
    await ensureCurrencyInfrastructure();
    const base = CurrencyService.normalizeCurrency(baseCurrency);
    const row = await queryOne(
      `select base_currency, rates, source, last_updated, expires_at
       from public.exchange_rates
       where base_currency = $1
       limit 1`,
      [base],
    );
    if (!row?.rates || !row?.last_updated) {
      const err = new Error('Exchange rates are not available. Please try again later.');
      err.code = 'EXCHANGE_RATE_MISSING';
      err.statusCode = 503;
      throw err;
    }
    const expiresAt = row.expires_at ? new Date(row.expires_at) : rateExpiry(row.last_updated, maxAgeMinutes);
    if (Date.now() > expiresAt.getTime()) {
      const err = new Error('Exchange rates are stale. Please try again shortly.');
      err.code = 'EXCHANGE_RATE_EXPIRED';
      err.statusCode = 503;
      throw err;
    }
    return {
      baseCurrency: base,
      rates: row.rates,
      source: row.source || 'database',
      timestamp: new Date(row.last_updated).toISOString(),
      expiresAt: expiresAt.toISOString(),
    };
  }

  static async getExchangeRate(fromCurrency, toCurrency, options = {}) {
    const from = CurrencyService.normalizeCurrency(fromCurrency);
    const to = CurrencyService.normalizeCurrency(toCurrency);
    if (from === to) {
      return { rate: 1, source: 'same_currency', timestamp: nowIso(), baseCurrency: from };
    }

    const cached = await CurrencyService.getCachedRates(options);
    const rates = cached.rates || {};
    const fromRate = from === cached.baseCurrency ? 1 : Number(rates[from]);
    const toRate = to === cached.baseCurrency ? 1 : Number(rates[to]);
    if (!Number.isFinite(fromRate) || fromRate <= 0) {
      const err = new Error(`Exchange rate missing for ${from}.`);
      err.code = 'EXCHANGE_RATE_MISSING';
      err.statusCode = 503;
      throw err;
    }
    if (!Number.isFinite(toRate) || toRate <= 0) {
      const err = new Error(`Exchange rate missing for ${to}.`);
      err.code = 'EXCHANGE_RATE_MISSING';
      err.statusCode = 503;
      throw err;
    }

    return {
      rate: toRate / fromRate,
      source: cached.source,
      timestamp: cached.timestamp,
      expiresAt: cached.expiresAt,
      baseCurrency: cached.baseCurrency,
    };
  }

  static async convertMoney(amountMinor, fromCurrency, toCurrency, options = {}) {
    const from = CurrencyService.normalizeCurrency(fromCurrency);
    const to = CurrencyService.normalizeCurrency(toCurrency);
    assertInteger(Number(amountMinor), 'amountMinor');
    if (from === to) {
      return {
        amount_minor: Number(amountMinor),
        currency: to,
        original_amount_minor: Number(amountMinor),
        original_currency: from,
        exchange_rate: 1,
        exchange_rate_source: 'same_currency',
        exchange_rate_timestamp: nowIso(),
      };
    }

    const rate = await CurrencyService.getExchangeRate(from, to, options);
    const converted = multiplyRatioRound(Number(amountMinor), decimalToRatio(rate.rate));
    const money = {
      amount_minor: converted,
      currency: to,
      original_amount_minor: Number(amountMinor),
      original_currency: from,
      exchange_rate: rate.rate,
      exchange_rate_source: rate.source,
      exchange_rate_timestamp: rate.timestamp,
    };
    await query(
      `insert into public.currency_conversion_audit_logs
       (from_currency, to_currency, amount_minor, converted_amount_minor, exchange_rate, exchange_rate_source, exchange_rate_timestamp, context)
       values ($1,$2,$3,$4,$5,$6,$7,$8::jsonb)`,
      [from, to, Number(amountMinor), converted, rate.rate, rate.source, rate.timestamp, toJson(options.context || {})],
    ).catch(() => {});
    return money;
  }

  static calculatePlatformFee(amountMinor, feePercent = 15) {
    assertInteger(Number(amountMinor), 'amountMinor');
    return Math.round((Number(amountMinor) * Number(feePercent || 0)) / 100);
  }

  static calculateWithdrawalFee(amountMinor, { fixedFeeMinor = 0, percent = 0 } = {}) {
    assertInteger(Number(amountMinor), 'amountMinor');
    return Math.max(0, Number(fixedFeeMinor || 0) + Math.round((Number(amountMinor) * Number(percent || 0)) / 100));
  }

  static calculateTravelerPayout({ weightKg, pricePerKgMinor }) {
    const weight = Number(weightKg);
    assertInteger(Number(pricePerKgMinor), 'pricePerKgMinor');
    if (!Number.isFinite(weight) || weight <= 0) return 0;
    return Math.round(weight * Number(pricePerKgMinor));
  }

  static calculateSenderTotal({ travelerPayoutMinor, platformFeeMinor = 0, processingFeeMinor = 0, fxBufferMinor = 0, insuranceFeeMinor = 0 }) {
    for (const [name, value] of Object.entries({ travelerPayoutMinor, platformFeeMinor, processingFeeMinor, fxBufferMinor, insuranceFeeMinor })) {
      assertInteger(Number(value), name);
    }
    return Number(travelerPayoutMinor) + Number(platformFeeMinor) + Number(processingFeeMinor) + Number(fxBufferMinor) + Number(insuranceFeeMinor);
  }
}

export async function fetchAndCacheRates(options = {}) {
  return CurrencyService.refreshRates(options);
}

export async function convertCurrency(amount, fromCurrency, toCurrency) {
  const from = CurrencyService.normalizeCurrency(fromCurrency);
  const to = CurrencyService.normalizeCurrency(toCurrency);
  if (from === to) return Number(amount);
  const amountMinor = CurrencyService.majorToMinor(amount, from);
  const converted = await CurrencyService.convertMoney(amountMinor, from, to);
  return CurrencyService.minorToMajor(converted.amount_minor, to);
}

export async function getExchangeRate(fromCurrency, toCurrency) {
  const result = await CurrencyService.getExchangeRate(fromCurrency, toCurrency);
  return result.rate;
}

export function calculateTravelerPrice(weight, pricePerKg) {
  return parseFloat((Number(weight) * Number(pricePerKg)).toFixed(2));
}

export function calculateCommission(amount, commissionRate = PLATFORM_COMMISSION_RATE) {
  return parseFloat((Number(amount) * Number(commissionRate)).toFixed(2));
}

export function calculateTravelerPayout(totalPrice, commission) {
  return parseFloat((Number(totalPrice) - Number(commission)).toFixed(2));
}

const COUNTRY_CURRENCY_MAP = {
  US: 'USD', GB: 'GBP', EU: 'EUR', DE: 'EUR', FR: 'EUR', IT: 'EUR', ES: 'EUR',
  PT: 'EUR', NL: 'EUR', BE: 'EUR', AT: 'EUR', FI: 'EUR', IE: 'EUR', GR: 'EUR',
  NG: 'NGN', GH: 'GHS', KE: 'KES', ZA: 'ZAR', RW: 'RWF', UG: 'UGX', TZ: 'TZS',
  SN: 'XOF', CI: 'XOF', CM: 'XAF', ET: 'ETB', EG: 'EGP', MA: 'MAD', TN: 'TND',
  CA: 'CAD', AU: 'AUD', NZ: 'NZD', JP: 'JPY', CN: 'CNY', IN: 'INR', BR: 'BRL',
  MX: 'MXN', CH: 'CHF', SE: 'SEK', NO: 'NOK', DK: 'DKK', SG: 'SGD', HK: 'HKD',
  AE: 'AED', SA: 'SAR', QA: 'QAR', KW: 'KWD', PK: 'PKR', BD: 'BDT', LK: 'LKR',
};

export function getCurrencyByCountry(countryCode) {
  if (!countryCode) return 'USD';
  return COUNTRY_CURRENCY_MAP[countryCode.toUpperCase()] ?? 'USD';
}

export function choosePaymentProcessor(currency) {
  const africanCurrencies = ['NGN', 'GHS', 'KES', 'ZAR', 'RWF', 'UGX', 'TZS'];
  return africanCurrencies.includes(CurrencyService.normalizeCurrency(currency)) ? 'paystack' : 'paypal';
}

export async function getAllRates() {
  const cached = await CurrencyService.getCachedRates();
  return {
    baseCurrency: cached.baseCurrency,
    rates: cached.rates,
    source: cached.source,
    timestamp: cached.timestamp,
    expiresAt: cached.expiresAt,
    supportedCurrencies: [...SUPPORTED_CURRENCIES],
  };
}

export function formatCurrency(amount, currency, locale = 'en-US') {
  return CurrencyService.formatMoney(CurrencyService.majorToMinor(amount, currency), currency, locale);
}

export async function processPaymentQuote({ weight, travelerPricePerKg, travelerCurrency, senderCurrency }) {
  const travelerPayout = calculateTravelerPrice(weight, travelerPricePerKg);
  const config = await getFullPricingConfig();
  const breakdown = calculateAllInclusivePrice(travelerPayout, config);
  const senderAmount = await convertCurrency(breakdown.senderShippingFee, travelerCurrency, senderCurrency);
  const processor = choosePaymentProcessor(senderCurrency);

  return {
    weight: Number(weight),
    travelerPricePerKg: Number(travelerPricePerKg),
    travelerCurrency: CurrencyService.normalizeCurrency(travelerCurrency),
    senderCurrency: CurrencyService.normalizeCurrency(senderCurrency),
    travelerTotal: breakdown.travelerPayout,
    travelerPayout: breakdown.travelerPayout,
    senderTotal: breakdown.senderShippingFee,
    commission: breakdown.platformCommission,
    platformCommission: breakdown.platformCommission,
    processingFee: breakdown.processingFee,
    fxBuffer: breakdown.fxBuffer,
    bagoNetRevenue: breakdown.bagoNetRevenue,
    senderAmount: Number(senderAmount.toFixed(2)),
    paymentProcessor: processor,
    formatted: {
      travelerPayout: formatCurrency(breakdown.travelerPayout, travelerCurrency),
      senderAmount: formatCurrency(senderAmount, senderCurrency),
    },
  };
}
