import api from './api';
import { API_ENDPOINTS } from './config';

export interface ExchangeRateResult {
  success: boolean;
  rates: Record<string, number>;
  base: string;
  timestamp: string;
}

export interface ConversionResult {
  success: boolean;
  conversion: {
    originalAmount: number;
    convertedAmount: number;
    originalCurrency: string;
    targetCurrency: string;
    timestamp: string;
  };
  formatted: {
    original: string;
    converted: string;
  };
}

class CurrencyService {
  private ratesCache: Record<string, number> | null = null;
  private lastFetch: number = 0;
  private CACHE_DURATION = 1000 * 60 * 60; // 1 hour

  /**
   * Get all exchange rates
   */
  async getRates(): Promise<Record<string, number>> {
    const now = Date.now();
    if (this.ratesCache && now - this.lastFetch < this.CACHE_DURATION) {
      return this.ratesCache;
    }

    try {
      const response = await api.get<ExchangeRateResult>('/api/currency/rates');
      this.ratesCache = response.data.rates;
      this.lastFetch = now;
      return this.ratesCache;
    } catch (error) {
      console.error('Failed to fetch rates:', error);
      return this.ratesCache || { USD: 1 };
    }
  }

  /**
   * Convert amount
   */
  async convert(amount: number, from: string, to: string): Promise<number> {
    if (from === to) return amount;
    
    const rates = await this.getRates();
    if (rates[from] && rates[to]) {
      // Logic: amount * (targetRate / sourceRate)
      // Assuming rates are relative to a base (e.g. USD)
      const baseAmount = amount / rates[from];
      return baseAmount * rates[to];
    }
    
    // Fallback to API if manual calc fails or rates missing
    try {
      const response = await api.get<ConversionResult>('/api/currency/convert', {
        params: { amount, from, to }
      });
      return response.data.conversion.convertedAmount;
    } catch (error) {
      return amount; // Fallback to original
    }
  }

  /**
   * Format currency
   */
  format(amount: number, currency: string): string {
    const symbols: Record<string, string> = {
      USD: '$',
      NGN: '₦',
      GBP: '£',
      EUR: '€',
      CAD: 'CA$',
      GHS: 'GH₵'
    };
    const symbol = symbols[currency] || currency;
    return `${symbol}${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
}

export default new CurrencyService();
