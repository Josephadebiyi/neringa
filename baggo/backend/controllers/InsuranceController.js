import InsuranceSetting from '../models/insuranceSettingScheme.js';

/**
 * Calculate insurance cost based on item value and weight
 * @param {Number} itemValue - Declared value of the item in USD
 * @param {Number} weight - Weight in kg
 * @returns {Object} - Insurance calculation details
 */
export const calculateInsurance = async (req, res) => {
  try {
    const { itemValue, weight, currency = 'USD' } = req.query;

    if (!itemValue || isNaN(itemValue) || itemValue < 0) {
      return res.status(400).json({
        success: false,
        message: 'Valid item value is required',
      });
    }

    // Get current insurance settings
    let settings = await InsuranceSetting.findOne();

    // Create default settings if none exist
    if (!settings) {
      settings = await InsuranceSetting.create({});
    }

    if (!settings.enabled) {
      return res.status(200).json({
        success: true,
        available: false,
        message: 'Insurance is currently unavailable',
      });
    }

    const value = parseFloat(itemValue);

    // Check if value exceeds maximum coverage
    if (value > settings.maxCoverageAmount) {
      return res.status(400).json({
        success: false,
        message: `Item value exceeds maximum coverage of $${settings.maxCoverageAmount}`,
        maxCoverage: settings.maxCoverageAmount,
      });
    }

    // Calculate insurance cost: base rate + percentage of value
    let insuranceCost = settings.baseRate + (value * (settings.percentageOfValue / 100));

    // Apply minimum and maximum limits
    insuranceCost = Math.max(insuranceCost, settings.minimumCharge);
    insuranceCost = Math.min(insuranceCost, settings.maximumCharge);

    // Round to 2 decimal places
    insuranceCost = Math.round(insuranceCost * 100) / 100;

    // If currency is not USD, convert the cost
    let convertedCost = insuranceCost;
    let exchangeRate = 1;

    if (currency !== 'USD') {
      try {
        const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
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
      settings = await InsuranceSetting.create({});
    }

    return res.status(200).json({
      success: true,
      data: {
        enabled: settings.enabled,
        baseRate: settings.baseRate,
        percentageOfValue: settings.percentageOfValue,
        minimumCharge: settings.minimumCharge,
        maximumCharge: settings.maximumCharge,
        maxCoverageAmount: settings.maxCoverageAmount,
        description: settings.description,
        terms: settings.terms,
      },
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
      baseRate,
      percentageOfValue,
      minimumCharge,
      maximumCharge,
      maxCoverageAmount,
      enabled,
      description,
      terms,
    } = req.body;

    let settings = await InsuranceSetting.findOne();

    if (!settings) {
      settings = await InsuranceSetting.create(req.body);
    } else {
      // Update only provided fields
      if (baseRate !== undefined) settings.baseRate = baseRate;
      if (percentageOfValue !== undefined) settings.percentageOfValue = percentageOfValue;
      if (minimumCharge !== undefined) settings.minimumCharge = minimumCharge;
      if (maximumCharge !== undefined) settings.maximumCharge = maximumCharge;
      if (maxCoverageAmount !== undefined) settings.maxCoverageAmount = maxCoverageAmount;
      if (enabled !== undefined) settings.enabled = enabled;
      if (description !== undefined) settings.description = description;
      if (terms !== undefined) settings.terms = terms;

      settings.updatedAt = new Date();
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
