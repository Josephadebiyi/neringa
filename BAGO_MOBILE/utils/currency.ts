// Currency formatting and conversion utility
import api from './api';

export interface CurrencySettings {
  code: string;
  symbol: string;
  position: 'before' | 'after';
}

// Currency map
export const CURRENCIES: Record<string, CurrencySettings> = {
  USD: { code: 'USD', symbol: '$', position: 'before' },
  EUR: { code: 'EUR', symbol: '€', position: 'before' },
  GBP: { code: 'GBP', symbol: '£', position: 'before' },
  NGN: { code: 'NGN', symbol: '₦', position: 'before' },
  GHS: { code: 'GHS', symbol: '₵', position: 'before' },
  KES: { code: 'KES', symbol: 'KSh', position: 'before' },
  ZAR: { code: 'ZAR', symbol: 'R', position: 'before' },
  INR: { code: 'INR', symbol: '₹', position: 'before' },
  CNY: { code: 'CNY', symbol: '¥', position: 'before' },
  JPY: { code: 'JPY', symbol: '¥', position: 'before' },
  CAD: { code: 'CAD', symbol: 'C$', position: 'before' },
  AUD: { code: 'AUD', symbol: 'A$', position: 'before' },
  BRL: { code: 'BRL', symbol: 'R$', position: 'before' },
};

// Cache for exchange rates
let ratesCache: { rates: Record<string, number>; lastUpdated: Date | null } = {
  rates: {},
  lastUpdated: null,
};

// Fetch exchange rates from backend
export const fetchExchangeRates = async (): Promise<Record<string, number>> => {
  try {
    const response = await api.get('/api/currency/rates');
    if (response.data.success) {
      ratesCache = {
        rates: response.data.rates,
        lastUpdated: new Date(),
      };
      return response.data.rates;
    }
    return ratesCache.rates;
  } catch (error) {
    console.error('Failed to fetch exchange rates:', error);
    return ratesCache.rates;
  }
};

// Get cached rates or fetch if stale (more than 1 hour old)
export const getExchangeRates = async (): Promise<Record<string, number>> => {
  const oneHour = 60 * 60 * 1000;
  if (
    !ratesCache.lastUpdated ||
    new Date().getTime() - ratesCache.lastUpdated.getTime() > oneHour ||
    Object.keys(ratesCache.rates).length === 0
  ) {
    return await fetchExchangeRates();
  }
  return ratesCache.rates;
};

// Convert amount from one currency to another
export const convertCurrency = async (
  amount: number,
  fromCurrency: string,
  toCurrency: string
): Promise<number> => {
  if (fromCurrency === toCurrency) return amount;
  
  const rates = await getExchangeRates();
  
  if (!rates[fromCurrency] || !rates[toCurrency]) {
    console.error(`Invalid currency code: ${fromCurrency} or ${toCurrency}`);
    return amount;
  }
  
  // Convert to USD first, then to target currency
  const amountInUSD = amount / rates[fromCurrency];
  const convertedAmount = amountInUSD * rates[toCurrency];
  
  return Math.round(convertedAmount * 100) / 100;
};

// Format price with currency
export function formatPrice(value: number, currencyCode: string = 'USD'): string {
  const currency = CURRENCIES[currencyCode] || CURRENCIES.USD;
  const formattedValue = value.toFixed(2);
  
  if (currency.position === 'before') {
    return `${currency.symbol}${formattedValue}`;
  } else {
    return `${formattedValue}${currency.symbol}`;
  }
}

// Get currency symbol
export function getCurrencySymbol(currencyCode: string): string {
  return CURRENCIES[currencyCode]?.symbol || '$';
}

// Update user's preferred currency on backend
export const updateUserCurrency = async (currency: string): Promise<boolean> => {
  try {
    const response = await api.post('/api/baggo/user/currency', { currency });
    return response.data.success;
  } catch (error) {
    console.error('Failed to update user currency:', error);
    return false;
  }
};
