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
    const { itemValue, weight, currency = 'USD', region = 'global' } = req.query;

    if (!itemValue || isNaN(itemValue) || itemValue < 0) {
      return res.status(400).json({
        success: false,
        message: 'Valid item value is required',
      });
    }

    // Get current insurance settings
    let settings = await InsuranceSetting.findOne();

    if (!settings) {
      settings = await InsuranceSetting.create({
        global: { baseRate: 5, percentageOfValue: 2, minimumCharge: 3, maximumCharge: 100, maxCoverageAmount: 5000, currency: 'USD' },
        africa: { baseRate: 15000, percentageOfValue: 0, minimumCharge: 0, maximumCharge: 0, maxCoverageAmount: 2000000, currency: 'NGN' },
        europe: { baseRate: 7, percentageOfValue: 3, minimumCharge: 5, maximumCharge: 150, maxCoverageAmount: 10000, currency: 'USD' },
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

    // Calculate insurance cost: base rate + percentage of value
    let insuranceCost = config.baseRate + (value * (config.percentageOfValue / 100));

    // Apply minimum and maximum limits
    if (config.minimumCharge > 0) {
      insuranceCost = Math.max(insuranceCost, config.minimumCharge);
    }
    if (config.maximumCharge > 0) {
      insuranceCost = Math.min(insuranceCost, config.maximumCharge);
    }

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
        costUSD: insuranceCost,
        cost: convertedCost,
        currency: currency,
        exchangeRate: exchangeRate,
        coverageAmount: value,
        region: region,
        baseRate: config.baseRate,
        percentageOfValue: config.percentageOfValue,
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
      settings = await InsuranceSetting.create({
        global: { baseRate: 5, percentageOfValue: 2, minimumCharge: 3, maximumCharge: 100, maxCoverageAmount: 5000, currency: 'USD' },
        africa: { baseRate: 15000, percentageOfValue: 0, minimumCharge: 0, maximumCharge: 0, maxCoverageAmount: 2000000, currency: 'NGN' },
        europe: { baseRate: 7, percentageOfValue: 3, minimumCharge: 5, maximumCharge: 150, maxCoverageAmount: 10000, currency: 'USD' },
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
        if (!config) return undefined;
        return {
          baseRate: config.baseRate !== undefined ? Number(config.baseRate) : undefined,
          percentageOfValue: config.percentageOfValue !== undefined ? Number(config.percentageOfValue) : undefined,
          minimumCharge: config.minimumCharge !== undefined ? Number(config.minimumCharge) : undefined,
          maximumCharge: config.maximumCharge !== undefined ? Number(config.maximumCharge) : undefined,
          maxCoverageAmount: config.maxCoverageAmount !== undefined ? Number(config.maxCoverageAmount) : undefined,
          commissionPercentage: config.commissionPercentage !== undefined ? Number(config.commissionPercentage) : undefined,
          currency: config.currency !== undefined ? String(config.currency) : undefined,
          enabled: config.enabled !== undefined ? Boolean(config.enabled) : undefined,
        };
      };

      if (global) settings.global = { ...settings.global, ...parseConfig(global) };
      if (africa) settings.africa = { ...settings.africa, ...parseConfig(africa) };
      if (europe) settings.europe = { ...settings.europe, ...parseConfig(europe) };

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
