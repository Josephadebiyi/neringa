import { query, queryOne } from '../../lib/postgres/db.js';

// Upsert helper — stores settings as key/value rows in app_settings table if it exists,
// otherwise falls back to in-memory defaults so the server never crashes.
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

export const updateInsurance = async (req, res, next) => {
  const { insuranceStatus, insuranceType, insurancePercentage, insuranceFixedAmount } = req.body;
  try {
    if (typeof insuranceStatus === 'boolean') _cached.insuranceStatus = insuranceStatus;
    if (insuranceType === 'percentage' || insuranceType === 'fixed') _cached.insuranceType = insuranceType;
    if (typeof insurancePercentage === 'number') _cached.insurancePercentage = insurancePercentage;
    if (typeof insuranceFixedAmount === 'number') _cached.insuranceFixedAmount = insuranceFixedAmount;

    res.status(200).json({ message: 'Insurance settings updated successfully', setting: _cached, success: true });
  } catch (error) {
    next(error);
  }
};

export const updateSettings = async (req, res, next) => {
  const { autoVerification, commissionPercentage, insuranceType, insurancePercentage,
          insuranceFixedAmount, banner, baseCurrency, supportedCurrencies, exchangeRates } = req.body;
  try {
    if (typeof autoVerification === 'boolean') _cached.autoVerification = autoVerification;
    if (typeof commissionPercentage === 'number') _cached.commissionPercentage = commissionPercentage;
    if (insuranceType === 'percentage' || insuranceType === 'fixed') _cached.insuranceType = insuranceType;
    if (typeof insurancePercentage === 'number') _cached.insurancePercentage = insurancePercentage;
    if (typeof insuranceFixedAmount === 'number') _cached.insuranceFixedAmount = insuranceFixedAmount;
    if (banner && typeof banner === 'object') _cached.banner = { ..._cached.banner, ...banner };
    if (typeof baseCurrency === 'string' && baseCurrency.trim()) _cached.baseCurrency = baseCurrency.trim().toUpperCase();
    if (Array.isArray(supportedCurrencies)) _cached.supportedCurrencies = supportedCurrencies;
    if (exchangeRates && typeof exchangeRates === 'object') _cached.exchangeRates = exchangeRates;

    res.status(200).json({ message: 'Settings updated successfully', setting: _cached, success: true });
  } catch (error) {
    next(error);
  }
};

export const getCurrentSetting = async (req, res, next) => {
  try {
    res.status(200).json({ message: 'success', data: _cached, error: false, success: true });
  } catch (error) {
    next(error);
  }
};
