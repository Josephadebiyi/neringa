import { 
  convertCurrency, 
  getExchangeRate, 
  getAllRates, 
  formatCurrency,
  processPaymentQuote 
} from '../services/currencyConverter.js';

/**
 * Convert amount between currencies
 * GET /api/currency/convert?amount=100&from=USD&to=NGN
 */
export const convertAmount = async (req, res) => {
  try {
    const { amount, from, to } = req.query;

    if (!amount || !from || !to) {
      return res.status(400).json({
        success: false,
        message: 'Missing required parameters: amount, from, to'
      });
    }

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Amount must be a positive number'
      });
    }

    const convertedAmount = await convertCurrency(numAmount, from.toUpperCase(), to.toUpperCase());

    return res.status(200).json({
      success: true,
      conversion: {
        originalAmount: numAmount,
        convertedAmount,
        originalCurrency: from.toUpperCase(),
        targetCurrency: to.toUpperCase(),
        timestamp: new Date().toISOString()
      },
      formatted: {
        original: formatCurrency(numAmount, from.toUpperCase()),
        converted: formatCurrency(convertedAmount, to.toUpperCase())
      }
    });

  } catch (error) {
    console.error('Currency conversion error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to convert currency',
      error: error.message
    });
  }
};

/**
 * Get exchange rate between two currencies
 * GET /api/currency/rate?from=USD&to=NGN
 */
export const getRate = async (req, res) => {
  try {
    const { from, to } = req.query;

    if (!from || !to) {
      return res.status(400).json({
        success: false,
        message: 'Missing required parameters: from, to'
      });
    }

    const rate = await getExchangeRate(from.toUpperCase(), to.toUpperCase());

    return res.status(200).json({
      success: true,
      rate,
      from: from.toUpperCase(),
      to: to.toUpperCase(),
      description: `1 ${from.toUpperCase()} = ${rate} ${to.toUpperCase()}`
    });

  } catch (error) {
    console.error('Get rate error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to get exchange rate',
      error: error.message
    });
  }
};

/**
 * Get all available exchange rates
 * GET /api/currency/rates
 */
export const getAllExchangeRates = async (req, res) => {
  try {
    const result = await getAllRates();

    return res.status(200).json({
      success: true,
      ...result
    });

  } catch (error) {
    console.error('Get all rates error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch exchange rates',
      error: error.message
    });
  }
};

/**
 * Get a full payment quote
 * POST /api/currency/quote
 */
export const getPaymentQuote = async (req, res) => {
  try {
    const { weight, travelerPricePerKg, travelerCurrency, senderCurrency } = req.body;

    if (!weight || !travelerPricePerKg || !travelerCurrency || !senderCurrency) {
      return res.status(400).json({
        success: false,
        message: 'Missing required parameters'
      });
    }

    const quote = await processPaymentQuote({
      weight,
      travelerPricePerKg,
      travelerCurrency,
      senderCurrency
    });

    return res.status(200).json({
      success: true,
      quote
    });
  } catch (error) {
    console.error('Quote error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to generate quote',
      error: error.message
    });
  }
};
