import { 
  CurrencyService,
  convertCurrency, 
  getExchangeRate, 
  getAllRates, 
  formatCurrency,
  processPaymentQuote,
  choosePaymentProcessor,
} from '../services/currencyConverter.js';
import { calculateAllInclusivePrice, getFullPricingConfig } from '../services/pricingService.js';
import { getTripById } from '../lib/postgres/shipping.js';
import { getRouteProtectionFee } from '../services/myCoverPricing.js';

// Degrade path when the live rate service is down, same trade-off AddaTripController
// already makes for trip pricing: show an approximate price instead of blocking checkout.
const CHECKOUT_REFERENCE_RATES = {
  USD: 1, EUR: 0.92, GBP: 0.78, NGN: 1500, GHS: 15, KES: 130, ZAR: 18, CAD: 1.37, AUD: 1.52,
};

const isRateAvailabilityError = (error) =>
  error?.code === 'EXCHANGE_RATE_EXPIRED' ||
  error?.code === 'EXCHANGE_RATE_MISSING' ||
  error?.statusCode === 503 ||
  error?.status === 503;

const convertWithFallback = async (amount, fromCurrency, toCurrency) => {
  try {
    return Number(await convertCurrency(amount, fromCurrency, toCurrency));
  } catch (error) {
    if (!isRateAvailabilityError(error)) throw error;
    const fromRate = CHECKOUT_REFERENCE_RATES[fromCurrency];
    const toRate = CHECKOUT_REFERENCE_RATES[toCurrency];
    if (!fromRate || !toRate) throw error;
    console.warn(`Using reference FX for checkout preview after rate service failure: ${fromCurrency}->${toCurrency}`, error.message);
    return Number(((Number(amount) / fromRate) * toRate).toFixed(2));
  }
};

const getExchangeRateWithFallback = async (fromCurrency, toCurrency) => {
  try {
    const rate = await CurrencyService.getExchangeRate(fromCurrency, toCurrency);
    return rate;
  } catch (error) {
    if (!isRateAvailabilityError(error)) throw error;
    const fromRate = CHECKOUT_REFERENCE_RATES[fromCurrency];
    const toRate = CHECKOUT_REFERENCE_RATES[toCurrency];
    if (!fromRate || !toRate) throw error;
    console.warn(`Using reference FX rate for checkout preview after rate service failure: ${fromCurrency}->${toCurrency}`, error.message);
    return { rate: toRate / fromRate, source: 'reference_fallback', timestamp: new Date().toISOString() };
  }
};

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
    const rate = await CurrencyService.getExchangeRate(from.toUpperCase(), to.toUpperCase());

    return res.status(200).json({
      success: true,
      conversion: {
        originalAmount: numAmount,
        convertedAmount,
        originalCurrency: from.toUpperCase(),
        targetCurrency: to.toUpperCase(),
        exchangeRate: rate.rate,
        exchangeRateSource: rate.source,
        exchangeRateTimestamp: rate.timestamp,
        timestamp: new Date().toISOString()
      },
      formatted: {
        original: formatCurrency(numAmount, from.toUpperCase()),
        converted: formatCurrency(convertedAmount, to.toUpperCase())
      }
    });

  } catch (error) {
    console.error('Currency conversion error:', error);
    return res.status(error.statusCode || 500).json({
      success: false,
      message: 'Failed to convert currency',
      code: error.code,
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

    const details = await CurrencyService.getExchangeRate(from.toUpperCase(), to.toUpperCase());

    return res.status(200).json({
      success: true,
      rate,
      from: from.toUpperCase(),
      to: to.toUpperCase(),
      source: details.source,
      timestamp: details.timestamp,
      expiresAt: details.expiresAt,
      description: `1 ${from.toUpperCase()} = ${rate} ${to.toUpperCase()}`
    });

  } catch (error) {
    console.error('Get rate error:', error);
    return res.status(error.statusCode || 500).json({
      success: false,
      message: 'Failed to get exchange rate',
      code: error.code,
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
    return res.status(error.statusCode || 500).json({
      success: false,
      message: 'Failed to fetch exchange rates',
      code: error.code,
      error: error.message
    });
  }
};

/**
 * GET /api/currency/supported
 */
export const getSupportedCurrencies = async (_req, res) => {
  try {
    const result = await getAllRates();
    return res.status(200).json({
      success: true,
      baseCurrency: result.baseCurrency,
      supportedCurrencies: result.supportedCurrencies || Object.keys(result.rates || {}),
      source: result.source,
      timestamp: result.timestamp,
      expiresAt: result.expiresAt,
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      code: error.code,
      message: error.message,
    });
  }
};

/**
 * POST /api/currency/preview
 */
export const previewConversion = async (req, res) => {
  try {
    const { amountMinor, amount, fromCurrency, toCurrency, from, to } = req.body || {};
    const sourceCurrency = fromCurrency || from;
    const targetCurrency = toCurrency || to;
    if (!sourceCurrency || !targetCurrency) {
      return res.status(400).json({ success: false, message: 'fromCurrency and toCurrency are required.' });
    }
    const normalizedFrom = CurrencyService.normalizeCurrency(sourceCurrency);
    const normalizedTo = CurrencyService.normalizeCurrency(targetCurrency);
    const sourceAmountMinor = amountMinor != null
      ? Number(amountMinor)
      : CurrencyService.majorToMinor(amount, normalizedFrom);
    const converted = await CurrencyService.convertMoney(sourceAmountMinor, normalizedFrom, normalizedTo, {
      context: { endpoint: 'currency_preview' },
    });
    return res.status(200).json({ success: true, conversion: converted });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      code: error.code,
      message: error.message,
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
    return res.status(error.statusCode || 500).json({
      success: false,
      message: 'Failed to generate quote',
      code: error.code,
      error: error.message
    });
  }
};

/**
 * POST /api/checkout/shipment-preview
 * Backend-owned shipment checkout preview for frontend display.
 */
export const buildShipmentCheckoutPreview = async ({
  tripId,
  weight,
  senderCurrency,
  declaredValue = 0,
  insurance = false,
}) => {
    const numericWeight = Number(weight);
    const numericDeclaredValue = Number(declaredValue || 0);
    if (!Number.isFinite(numericWeight) || numericWeight <= 0) {
      const error = new Error('Weight must be greater than zero.');
      error.statusCode = 400;
      throw error;
    }
    if (!Number.isFinite(numericDeclaredValue) || numericDeclaredValue < 0) {
      const error = new Error('Declared value must be zero or greater.');
      error.statusCode = 400;
      throw error;
    }

    const trip = await getTripById(tripId);
    if (!trip?.id || !trip?.userId) {
      const error = new Error('Trip not found.');
      error.statusCode = 404;
      throw error;
    }

    const travelerCurrency = CurrencyService.normalizeCurrency(trip.currency || senderCurrency);
    const checkoutCurrency = CurrencyService.normalizeCurrency(senderCurrency);
    const pricePerKg = Number(trip.pricePerKg || 0);
    if (!Number.isFinite(pricePerKg) || pricePerKg <= 0) {
      const error = new Error('Trip price is not available.');
      error.statusCode = 400;
      throw error;
    }

    const config = await getFullPricingConfig();
    const travelerPayout = Number((numericWeight * pricePerKg).toFixed(2));
    const pricing = calculateAllInclusivePrice(travelerPayout, config);
    const shippingAmount = travelerCurrency === checkoutCurrency
      ? Number(pricing.senderShippingFee)
      : Number((await convertWithFallback(pricing.senderShippingFee, travelerCurrency, checkoutCurrency)).toFixed(2));
    const convertedTravelerPayout = travelerCurrency === checkoutCurrency
      ? Number(pricing.travelerPayout)
      : Number((await convertWithFallback(pricing.travelerPayout, travelerCurrency, checkoutCurrency)).toFixed(2));
    const convertBreakdownAmount = async (value) => travelerCurrency === checkoutCurrency
      ? Number(value)
      : Number((await convertWithFallback(value, travelerCurrency, checkoutCurrency)).toFixed(2));
    const platformFee = await convertBreakdownAmount(pricing.platformCommission || 0);
    const processingFee = await convertBreakdownAmount(pricing.processingFee || 0);
    const fxBuffer = await convertBreakdownAmount(pricing.fxBuffer || 0);
    // Derive the displayed Bago revenue from the authoritative sender amount so
    // independently rounded FX conversions can never make the breakdown differ
    // from the amount collected at checkout.
    const bagoNetRevenue = Number((shippingAmount - convertedTravelerPayout).toFixed(2));
    const protection = insurance === true
      ? await getRouteProtectionFee({
          fromCountry: trip.fromCountry,
          toCountry: trip.toCountry,
          currency: checkoutCurrency,
        })
      : { amount: 0, baseAmount: 0, baseCurrency: null, region: null };
    const insuranceAmount = protection.amount;
    const totalAmount = Number((shippingAmount + insuranceAmount).toFixed(2));
    const exchangeRate = travelerCurrency === checkoutCurrency
      ? { rate: 1, source: 'same_currency', timestamp: new Date().toISOString() }
      : await getExchangeRateWithFallback(travelerCurrency, checkoutCurrency);

    return {
        tripId: trip.id,
        travelerId: trip.userId,
        weight: numericWeight,
        travelerPricePerKg: pricePerKg,
        travelerCurrency,
        senderCurrency: checkoutCurrency,
        senderPaymentCurrency: checkoutCurrency,
        payoutCurrency: travelerCurrency,
        travelerPayout,
        convertedTravelerPayout,
        baseShippingAmount: travelerPayout,
        shippingAmount,
        insuranceAmount,
        totalAmount,
        platformFee,
        processingFee,
        fxBuffer,
        bagoNetRevenue,
        platformFeeTravelerCurrency: Number(pricing.platformCommission || 0),
        processingFeeTravelerCurrency: Number(pricing.processingFee || 0),
        fxBufferTravelerCurrency: Number(pricing.fxBuffer || 0),
        senderInsurancePercent: Number(config.senderInsurancePercent || 0),
        insuranceBaseAmount: protection.baseAmount,
        insuranceBaseCurrency: protection.baseCurrency,
        insuranceRegion: protection.region,
        insuranceRatePercent: 0,
        exchangeRate: exchangeRate.rate,
        exchangeRateSource: exchangeRate.source,
        exchangeRateTimestamp: exchangeRate.timestamp,
        paymentProcessor: choosePaymentProcessor(checkoutCurrency),
        formatted: {
          shippingAmount: formatCurrency(shippingAmount, checkoutCurrency),
          insuranceAmount: formatCurrency(insuranceAmount, checkoutCurrency),
          totalAmount: formatCurrency(totalAmount, checkoutCurrency),
          travelerPayout: formatCurrency(travelerPayout, travelerCurrency),
        },
    };
};

export const previewShipmentCheckout = async (req, res) => {
  try {
    const { tripId, weight, senderCurrency, declaredValue = 0, insurance = false } = req.body || {};
    if (!tripId || !weight || !senderCurrency) {
      return res.status(400).json({
        success: false,
        message: 'tripId, weight, and senderCurrency are required.',
      });
    }
    const preview = await buildShipmentCheckoutPreview({
      tripId,
      weight,
      senderCurrency,
      declaredValue,
      insurance,
    });
    return res.status(200).json({ success: true, preview });
  } catch (error) {
    console.error('Shipment checkout preview error:', error);
    return res.status(error.statusCode || 500).json({
      success: false,
      code: error.code,
      message: error.message || 'Checkout preview could not be calculated.',
    });
  }
};
