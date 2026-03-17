import InsuranceSetting from '../models/insuranceSettingScheme.js';

/**
 * Calculate insurance cost based on item value and weight
 * @param {Number} itemValue - Declared value of the item in USD
 * @param {Number} weight - Weight in kg
 * @param {String} region - africa, europe, or global
 * @returns {Object} - Insurance calculation details
 */
export const calculateInsurance = async (req, res) => {
  try {
    const { itemValue, currency = 'USD', region = 'global' } = req.query;

    if (!itemValue || isNaN(itemValue) || itemValue < 0) {
      return res.status(400).json({
        success: false,
        message: 'Valid item value is required',
      });
    }

    // Get current insurance settings
    let settings = await InsuranceSetting.findOne();

    if (!settings) {
      // Fixed insurance pricing by region
      settings = await InsuranceSetting.create({
        global: { fixedPrice: 6, maxCoverageAmount: 5000, commissionPercentage: 15, currency: 'USD', enabled: true },
        africa: { fixedPrice: 3000, maxCoverageAmount: 2000000, commissionPercentage: 15, currency: 'NGN', enabled: true },
        europe: { fixedPrice: 6, maxCoverageAmount: 10000, commissionPercentage: 15, currency: 'USD', enabled: true },
        enabled: true
      });
    }

    if (!settings.enabled) {
      return res.status(200).json({
        success: true,
        available: false,
        message: 'Insurance is currently unavailable',
      });
    }

    // Select region config
    const config = settings[region.toLowerCase()] || settings.global;

    if (!config || !config.enabled) {
      return res.status(200).json({
        success: true,
        available: false,
        message: `Insurance is currently unavailable for ${region}`,
      });
    }

    const value = parseFloat(itemValue);

    // Check if value exceeds maximum coverage
    if (value > config.maxCoverageAmount) {
      return res.status(400).json({
        success: false,
        message: `Item value exceeds maximum coverage of $${config.maxCoverageAmount} for this region`,
        maxCoverage: config.maxCoverageAmount,
      });
    }

    // Calculate insurance cost - FIXED PRICE MODEL
    // All regions use a simple fixed price that gets converted to user's currency
    let insuranceCost = config.fixedPrice || 6;

    // Round to 2 decimal places
    insuranceCost = Math.round(insuranceCost * 100) / 100;

    // If requested currency is not the exact config.currency, convert the cost
    let convertedCost = insuranceCost;
    let exchangeRate = 1;

    if (currency !== config.currency) {
      try {
        const response = await fetch(`https://api.exchangerate-api.com/v4/latest/${config.currency || 'USD'}`);
        const data = await response.json();

        if (data && data.rates && data.rates[currency]) {
          exchangeRate = data.rates[currency];
          convertedCost = Math.round(insuranceCost * exchangeRate * 100) / 100;
        }
      } catch (err) {
        console.error('Currency conversion error:', err);
      }
    }

    return res.status(200).json({
      success: true,
      available: true,
      insurance: {
        cost: convertedCost,
        currency: currency,
        exchangeRate: exchangeRate,
        coverageAmount: value,
        region: region,
        fixedPrice: config.fixedPrice,
        baseCurrency: config.currency || 'USD',
        commissionPercentage: config.commissionPercentage || 15,
        description: settings.description,
        terms: settings.terms,
      },
    });

  } catch (error) {
    console.error('Error calculating insurance:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to calculate insurance',
      error: error.message,
    });
  }
};

/**
 * Get current insurance settings (public)
 */
export const getInsuranceSettings = async (req, res) => {
  try {
    let settings = await InsuranceSetting.findOne();

    if (!settings) {
      // Fixed insurance pricing by region
      settings = await InsuranceSetting.create({
        global: { fixedPrice: 6, maxCoverageAmount: 5000, commissionPercentage: 15, currency: 'USD', enabled: true },
        africa: { fixedPrice: 3000, maxCoverageAmount: 2000000, commissionPercentage: 15, currency: 'NGN', enabled: true },
        europe: { fixedPrice: 6, maxCoverageAmount: 10000, commissionPercentage: 15, currency: 'USD', enabled: true },
        enabled: true
      });
    }

    return res.status(200).json({
      success: true,
      data: settings,
    });

  } catch (error) {
    console.error('Error fetching insurance settings:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch insurance settings',
      error: error.message,
    });
  }
};

/**
 * Update insurance settings (Admin only)
 */
export const updateInsuranceSettings = async (req, res) => {
  try {
    const {
      global,
      africa,
      europe,
      enabled,
      description,
      terms,
    } = req.body;

    let settings = await InsuranceSetting.findOne();

    if (!settings) {
      settings = await InsuranceSetting.create(req.body);
    } else {
      const parseConfig = (config) => {
        if (!config) return {};
        const parsed = {};
        if (config.fixedPrice !== undefined) parsed.fixedPrice = Number(config.fixedPrice);
        if (config.maxCoverageAmount !== undefined) parsed.maxCoverageAmount = Number(config.maxCoverageAmount);
        if (config.commissionPercentage !== undefined) parsed.commissionPercentage = Number(config.commissionPercentage);
        if (config.currency !== undefined) parsed.currency = String(config.currency);
        if (config.enabled !== undefined) parsed.enabled = Boolean(config.enabled);
        return parsed;
      };

      if (global) {
        const parsedGlobal = parseConfig(global);
        settings.global = { ...settings.global.toObject(), ...parsedGlobal };
      }
      if (africa) {
        const parsedAfrica = parseConfig(africa);
        settings.africa = { ...settings.africa.toObject(), ...parsedAfrica };
      }
      if (europe) {
        const parsedEurope = parseConfig(europe);
        settings.europe = { ...settings.europe.toObject(), ...parsedEurope };
      }

      if (enabled !== undefined) settings.enabled = Boolean(enabled);
      if (description !== undefined) settings.description = String(description);
      if (terms !== undefined) settings.terms = String(terms);

      await settings.save();
    }

    return res.status(200).json({
      success: true,
      message: 'Insurance settings updated successfully',
      data: settings,
    });

  } catch (error) {
    console.error('Error updating insurance settings:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update insurance settings',
      error: error.message,
    });
  }
};
