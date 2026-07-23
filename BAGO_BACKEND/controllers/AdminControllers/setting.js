import { query, queryOne } from '../../lib/postgres/db.js';

const DEFAULTS = {
  insuranceStatus: true,
  insuranceType: 'percentage',
  insurancePercentage: 0.5,
  insuranceFixedAmount: 3000,
  insuranceCurrency: 'NGN',
  insuranceCapAmount: 3000,
  commissionPercentage: 15,
  // All-inclusive sender pricing (surcharge on top of traveler payout)
  platformCommissionPercent: 15,
  processingFeePercent: 0,
  fxBufferPercent: 0,
  senderInsurancePercent: 0.5,
  autoVerification: false,
  baseCurrency: 'USD',
  supportedCurrencies: ['USD', 'EUR', 'GBP', 'CAD', 'NGN', 'GHS', 'KES', 'ZAR'],
  exchangeRates: { USD: 1, EUR: 0.92, GBP: 0.79, CAD: 1.36, NGN: 1550, GHS: 15.2, KES: 129, ZAR: 18.5 },
  referralEnabled: true,
  referralWelcomeBonusNgn: 2000,
  referralShipmentThresholdUsd: 50,
  referralShipmentBonusUsd: 2,
  banner: null,
};

let _cached = { ...DEFAULTS };
let _loaded = false;

async function ensureConfigTable() {
  await query(`
    CREATE TABLE IF NOT EXISTS public.bago_config (
      key TEXT PRIMARY KEY,
      value JSONB NOT NULL,
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);
}

async function persistSettings(settings) {
  try {
    await ensureConfigTable();
    await query(
      `INSERT INTO public.bago_config (key, value, updated_at)
       VALUES ('app_settings', $1, NOW())
       ON CONFLICT (key) DO UPDATE SET value = $1, updated_at = NOW()`,
      [JSON.stringify(settings)]
    );
  } catch (e) {
    console.error('⚠️ Failed to persist settings:', e.message);
  }
}

async function loadSettings() {
  if (_loaded) return;
  try {
    await ensureConfigTable();
    const row = await queryOne(`SELECT value FROM public.bago_config WHERE key = 'app_settings'`);
    if (row?.value) {
      const stored = typeof row.value === 'string' ? JSON.parse(row.value) : row.value;
      _cached = { ...DEFAULTS, ...stored };
    }
  } catch (e) {
    console.error('⚠️ Failed to load settings from DB:', e.message);
  }
  _loaded = true;
}

export const updateInsurance = async (req, res, next) => {
  const { insuranceStatus, insuranceType, insurancePercentage, insuranceFixedAmount } = req.body;
  try {
    await loadSettings();
    if (typeof insuranceStatus === 'boolean') _cached.insuranceStatus = insuranceStatus;
    if (insuranceType === 'percentage' || insuranceType === 'fixed') _cached.insuranceType = insuranceType;
    if (typeof insurancePercentage === 'number') _cached.insurancePercentage = insurancePercentage;
    if (typeof insuranceFixedAmount === 'number') _cached.insuranceFixedAmount = insuranceFixedAmount;
    await persistSettings(_cached);
    res.status(200).json({ message: 'Insurance settings updated successfully', setting: _cached, success: true });
  } catch (error) {
    next(error);
  }
};

export const updateSettings = async (req, res, next) => {
  const { autoVerification, commissionPercentage, insuranceType, insurancePercentage,
          insuranceFixedAmount, banner, baseCurrency, supportedCurrencies, exchangeRates,
          platformCommissionPercent, processingFeePercent, fxBufferPercent, senderInsurancePercent,
          referralEnabled, referralWelcomeBonusNgn, referralShipmentThresholdUsd, referralShipmentBonusUsd } = req.body;
  try {
    await loadSettings();
    if (typeof autoVerification === 'boolean') _cached.autoVerification = autoVerification;
    _cached.commissionPercentage = 15;
    if (insuranceType === 'percentage' || insuranceType === 'fixed') _cached.insuranceType = insuranceType;
    if (typeof insurancePercentage === 'number' && insurancePercentage >= 0 && insurancePercentage <= 100) _cached.insurancePercentage = insurancePercentage;
    if (typeof insuranceFixedAmount === 'number' && insuranceFixedAmount >= 0) _cached.insuranceFixedAmount = insuranceFixedAmount;
    if (banner && typeof banner === 'object') _cached.banner = { ..._cached.banner, ...banner };
    if (typeof baseCurrency === 'string' && baseCurrency.trim()) _cached.baseCurrency = baseCurrency.trim().toUpperCase();
    if (Array.isArray(supportedCurrencies)) _cached.supportedCurrencies = supportedCurrencies;
    if (exchangeRates && typeof exchangeRates === 'object') {
      const allPositive = Object.values(exchangeRates).every(r => typeof r === 'number' && r > 0);
      if (allPositive) _cached.exchangeRates = exchangeRates;
    }
    _cached.platformCommissionPercent = 15;
    _cached.processingFeePercent = 0;
    _cached.fxBufferPercent = 0;
    if (typeof senderInsurancePercent === 'number' && senderInsurancePercent >= 0 && senderInsurancePercent <= 100) _cached.senderInsurancePercent = senderInsurancePercent;
    if (typeof referralEnabled === 'boolean') _cached.referralEnabled = referralEnabled;
    if (typeof referralWelcomeBonusNgn === 'number' && referralWelcomeBonusNgn >= 0) _cached.referralWelcomeBonusNgn = referralWelcomeBonusNgn;
    if (typeof referralShipmentThresholdUsd === 'number' && referralShipmentThresholdUsd >= 0) _cached.referralShipmentThresholdUsd = referralShipmentThresholdUsd;
    if (typeof referralShipmentBonusUsd === 'number' && referralShipmentBonusUsd >= 0) _cached.referralShipmentBonusUsd = referralShipmentBonusUsd;
    await persistSettings(_cached);
    res.status(200).json({ message: 'Settings updated successfully', setting: _cached, success: true });
  } catch (error) {
    next(error);
  }
};

export const getCurrentSetting = async (req, res, next) => {
  try {
    await loadSettings();
    const liveRatesRow = await queryOne(
      `SELECT rates, base_currency
       FROM public.exchange_rates
       WHERE base_currency = 'USD'
       ORDER BY last_updated DESC
       LIMIT 1`,
    ).catch(() => null);
    const liveRates = liveRatesRow?.rates && typeof liveRatesRow.rates === 'object'
      ? liveRatesRow.rates
      : null;
    const data = {
      ..._cached,
      commissionPercentage: 15,
      platformCommissionPercent: 15,
      processingFeePercent: 0,
      fxBufferPercent: 0,
      senderInsurancePercent: 0,
      insuranceType: 'fixed_regional',
      ...(liveRates ? {
        baseCurrency: 'USD',
        exchangeRates: { ...liveRates, USD: 1 },
      } : {}),
    };
    // Append publishable keys from server env — safe to expose to clients, never the secret keys.
    if (process.env.STRIPE_PUBLISHABLE_KEY) {
      data.stripePublishableKey = process.env.STRIPE_PUBLISHABLE_KEY;
    }
    res.status(200).json({ message: 'success', data, error: false, success: true });
  } catch (error) {
    next(error);
  }
};

export async function getAppSettings() {
  await loadSettings();
  return { ..._cached };
}
