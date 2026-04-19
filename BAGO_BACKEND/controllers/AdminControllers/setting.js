import { query, queryOne } from '../../lib/postgres/db.js';

const DEFAULTS = {
  insuranceStatus: true,
  insuranceType: 'percentage',
  insurancePercentage: 3,
  insuranceFixedAmount: 6,
  commissionPercentage: 10,
  autoVerification: false,
  baseCurrency: 'USD',
  supportedCurrencies: ['USD', 'EUR', 'GBP', 'CAD', 'NGN', 'GHS', 'KES', 'ZAR'],
  exchangeRates: { USD: 1, EUR: 0.92, GBP: 0.79, CAD: 1.36, NGN: 1550, GHS: 15.2, KES: 129, ZAR: 18.5 },
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
          insuranceFixedAmount, banner, baseCurrency, supportedCurrencies, exchangeRates } = req.body;
  try {
    await loadSettings();
    if (typeof autoVerification === 'boolean') _cached.autoVerification = autoVerification;
    if (typeof commissionPercentage === 'number' && commissionPercentage >= 0 && commissionPercentage <= 100) _cached.commissionPercentage = commissionPercentage;
    if (insuranceType === 'percentage' || insuranceType === 'fixed') _cached.insuranceType = insuranceType;
    if (typeof insurancePercentage === 'number' && insurancePercentage >= 0 && insurancePercentage <= 100) _cached.insurancePercentage = insurancePercentage;
    if (typeof insuranceFixedAmount === 'number' && insuranceFixedAmount >= 0) _cached.insuranceFixedAmount = insuranceFixedAmount;
    if (banner && typeof banner === 'object') _cached.banner = { ..._cached.banner, ...banner };
    if (typeof baseCurrency === 'string' && baseCurrency.trim()) _cached.baseCurrency = baseCurrency.trim().toUpperCase();
    if (Array.isArray(supportedCurrencies)) _cached.supportedCurrencies = supportedCurrencies;
    if (exchangeRates && typeof exchangeRates === 'object') {
      // Reject any zero or negative exchange rates to prevent divide-by-zero
      const allPositive = Object.values(exchangeRates).every(r => typeof r === 'number' && r > 0);
      if (allPositive) _cached.exchangeRates = exchangeRates;
    }
    await persistSettings(_cached);
    res.status(200).json({ message: 'Settings updated successfully', setting: _cached, success: true });
  } catch (error) {
    next(error);
  }
};

export const getCurrentSetting = async (req, res, next) => {
  try {
    await loadSettings();
    res.status(200).json({ message: 'success', data: _cached, error: false, success: true });
  } catch (error) {
    next(error);
  }
};

export async function getAppSettings() {
  await loadSettings();
  return { ..._cached };
}
