import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { backendomain } from '@/utils/backendDomain';

const CURRENCY_KEY = 'userCurrency';
const RATES_CACHE_KEY = 'exchangeRatesCache';
const RATES_CACHE_DURATION = 60 * 60 * 1000; // 1 hour in ms

// Currency symbol mapping
const CURRENCY_SYMBOLS: Record<string, string> = {
  // Africa
  NGN: '₦', GHS: '₵', KES: 'KSh', ZAR: 'R', EGP: 'E£',
  TZS: 'TSh', UGX: 'USh', MAD: 'DH', DZD: 'DA', SDG: '£',
  XOF: 'CFA', XAF: 'FCFA',
  // Americas
  USD: '$', CAD: 'CA$', MXN: '$', BRL: 'R$', ARS: '$',
  CLP: '$', COP: '$', PEN: 'S/', UYU: '$U',
  // Europe
  EUR: '€', GBP: '£', CHF: 'CHF',
  // Asia/Pacific
  INR: '₹', CNY: '¥', JPY: '¥', RUB: '₽', TRY: '₺',
  AED: 'د.إ', SGD: 'S$', AUD: 'A$', NZD: 'NZ$',
};

interface ExchangeRates {
  [key: string]: number;
}

interface RatesCache {
  rates: ExchangeRates;
  lastUpdated: number;
}

export const getCurrencySymbol = (currency: string): string => {
  return CURRENCY_SYMBOLS[currency] || currency;
};

export const useCurrency = () => {
  const [currency, setCurrency] = useState<string>('EUR');
  const [rates, setRates] = useState<ExchangeRates>({});
  const [loading, setLoading] = useState(true);

  const base = typeof backendomain === 'object' && backendomain.backendomain
    ? backendomain.backendomain
    : backendomain || 'http://localhost:5000';

  // Load saved currency and cached rates on mount
  useEffect(() => {
    const init = async () => {
      try {
        const [savedCurrency, cachedRatesStr] = await Promise.all([
          AsyncStorage.getItem(CURRENCY_KEY),
          AsyncStorage.getItem(RATES_CACHE_KEY),
        ]);

        if (savedCurrency) {
          setCurrency(savedCurrency);
        }

        if (cachedRatesStr) {
          const cachedRates: RatesCache = JSON.parse(cachedRatesStr);
          const now = Date.now();
          
          // Use cached rates if still valid
          if (now - cachedRates.lastUpdated < RATES_CACHE_DURATION) {
            setRates(cachedRates.rates);
            setLoading(false);
            return;
          }
        }

        // Fetch fresh rates
        await fetchRates();
      } catch (err) {
        console.error('Error initializing currency:', err);
        setLoading(false);
      }
    };

    init();
  }, []);

  const fetchRates = async () => {
    try {
      const response = await fetch(`${base}/api/currency/rates`);
      const data = await response.json();
      
      if (data.rates) {
        setRates(data.rates);
        
        // Cache the rates
        const cache: RatesCache = {
          rates: data.rates,
          lastUpdated: Date.now(),
        };
        await AsyncStorage.setItem(RATES_CACHE_KEY, JSON.stringify(cache));
      }
    } catch (err) {
      console.error('Error fetching exchange rates:', err);
    } finally {
      setLoading(false);
    }
  };

  const updateCurrency = useCallback(async (newCurrency: string) => {
    setCurrency(newCurrency);
    await AsyncStorage.setItem(CURRENCY_KEY, newCurrency);
  }, []);

  const convertPrice = useCallback((
    amount: number,
    fromCurrency: string = 'EUR',
    toCurrency?: string
  ): number => {
    const targetCurrency = toCurrency || currency;
    
    if (fromCurrency === targetCurrency) {
      return amount;
    }

    if (!rates[fromCurrency] || !rates[targetCurrency]) {
      return amount; // Return original if rates not available
    }

    // Convert to EUR first (base currency), then to target
    const amountInEur = amount / rates[fromCurrency];
    const convertedAmount = amountInEur * rates[targetCurrency];
    
    return Math.round(convertedAmount * 100) / 100; // Round to 2 decimal places
  }, [rates, currency]);

  const formatPrice = useCallback((
    amount: number,
    fromCurrency: string = 'EUR',
    options?: { showSymbol?: boolean; decimals?: number }
  ): string => {
    const { showSymbol = true, decimals = 2 } = options || {};
    const convertedAmount = convertPrice(amount, fromCurrency);
    const symbol = showSymbol ? getCurrencySymbol(currency) : '';
    
    return `${symbol}${convertedAmount.toFixed(decimals)}`;
  }, [convertPrice, currency]);

  return {
    currency,
    rates,
    loading,
    updateCurrency,
    convertPrice,
    formatPrice,
    getCurrencySymbol: () => getCurrencySymbol(currency),
    refreshRates: fetchRates,
  };
};

export default useCurrency;
