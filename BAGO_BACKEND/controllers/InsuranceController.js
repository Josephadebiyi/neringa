import { query as pgQuery, queryOne } from '../lib/postgres/db.js';
import fetch from 'node-fetch';

const DEFAULT_SETTINGS = {
  enabled: true,
  global: { fixedPrice: 6, maxCoverageAmount: 5000, commissionPercentage: 15, currency: 'USD', enabled: true },
  africa: { fixedPrice: 3000, maxCoverageAmount: 2000000, commissionPercentage: 15, currency: 'NGN', enabled: true },
  europe: { fixedPrice: 6, maxCoverageAmount: 10000, commissionPercentage: 15, currency: 'USD', enabled: true },
};

const ensureTable = () => pgQuery(`
  CREATE TABLE IF NOT EXISTS public.insurance_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    settings JSONB NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW()
  )
`).catch(() => {});

async function getSettings() {
  await ensureTable();
  const row = await queryOne(`SELECT settings FROM public.insurance_settings LIMIT 1`);
  if (row) return row.settings;
  // Seed defaults
  await pgQuery(`INSERT INTO public.insurance_settings (settings) VALUES ($1)`, [JSON.stringify(DEFAULT_SETTINGS)]).catch(() => {});
  return DEFAULT_SETTINGS;
}

export const calculateInsurance = async (req, res) => {
  try {
    const { itemValue, currency = 'USD', region = 'global' } = req.query;
    if (!itemValue || isNaN(itemValue) || itemValue < 0) {
      return res.status(400).json({ success: false, message: 'Valid item value is required' });
    }

    const settings = await getSettings();
    if (!settings.enabled) {
      return res.status(200).json({ success: true, available: false, message: 'Insurance is currently unavailable' });
    }

    const config = settings[region.toLowerCase()] || settings.global;
    if (!config?.enabled) {
      return res.status(200).json({ success: true, available: false, message: `Insurance unavailable for ${region}` });
    }

    const value = parseFloat(itemValue);
    if (value > config.maxCoverageAmount) {
      return res.status(400).json({ success: false, message: `Item value exceeds maximum coverage of ${config.maxCoverageAmount}`, maxCoverage: config.maxCoverageAmount });
    }

    let insuranceCost = config.fixedPrice || 6;
    let convertedCost = insuranceCost;
    let exchangeRate = 1;

    if (currency !== config.currency) {
      try {
        const response = await fetch(`https://api.exchangerate-api.com/v4/latest/${config.currency || 'USD'}`);
        const data = await response.json();
        if (data?.rates?.[currency]) {
          exchangeRate = data.rates[currency];
          convertedCost = Math.round(insuranceCost * exchangeRate * 100) / 100;
        }
      } catch (_) {}
    }

    return res.status(200).json({
      success: true,
      available: true,
      insurance: {
        cost: convertedCost,
        currency,
        exchangeRate,
        coverageAmount: value,
        region,
        fixedPrice: config.fixedPrice,
        baseCurrency: config.currency || 'USD',
        commissionPercentage: config.commissionPercentage || 15,
      },
    });
  } catch (error) {
    console.error('Error calculating insurance:', error);
    return res.status(500).json({ success: false, message: 'Failed to calculate insurance', error: error.message });
  }
};

export const getInsuranceSettings = async (req, res) => {
  try {
    const settings = await getSettings();
    return res.status(200).json({ success: true, data: settings });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch insurance settings', error: error.message });
  }
};

export const updateInsuranceSettings = async (req, res) => {
  try {
    await ensureTable();
    const current = await getSettings();
    const { global, africa, europe, enabled, description, terms } = req.body;

    const updated = { ...current };
    if (global) updated.global = { ...current.global, ...global };
    if (africa) updated.africa = { ...current.africa, ...africa };
    if (europe) updated.europe = { ...current.europe, ...europe };
    if (enabled !== undefined) updated.enabled = Boolean(enabled);
    if (description !== undefined) updated.description = String(description);
    if (terms !== undefined) updated.terms = String(terms);

    const row = await queryOne(`SELECT id FROM public.insurance_settings LIMIT 1`);
    if (row) {
      await pgQuery(`UPDATE public.insurance_settings SET settings = $1, updated_at = NOW() WHERE id = $2`, [JSON.stringify(updated), row.id]);
    } else {
      await pgQuery(`INSERT INTO public.insurance_settings (settings) VALUES ($1)`, [JSON.stringify(updated)]);
    }

    return res.status(200).json({ success: true, message: 'Insurance settings updated successfully', data: updated });
  } catch (error) {
    console.error('Error updating insurance settings:', error);
    return res.status(500).json({ success: false, message: 'Failed to update insurance settings', error: error.message });
  }
};
