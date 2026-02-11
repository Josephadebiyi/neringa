// Currency formatting utility
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
