import { useAuth } from '../contexts/AuthContext';

export const CURRENCIES = [
  { code: 'USD', name: 'US Dollar', symbol: '$' },
  { code: 'EUR', name: 'Euro', symbol: '€' },
  { code: 'GBP', name: 'British Pound', symbol: '£' },
  { code: 'NGN', name: 'Nigerian Naira', symbol: '₦' },
  { code: 'GHS', name: 'Ghanaian Cedi', symbol: '₵' },
  { code: 'KES', name: 'Kenyan Shilling', symbol: 'KSh' },
  { code: 'ZAR', name: 'SA Rand', symbol: 'R' },
];

export function useCurrency() {
  const { user } = useAuth();
  
  const preferredCurrency = user?.preferredCurrency || 'USD';
  const currencyData = CURRENCIES.find(c => c.code === preferredCurrency) || CURRENCIES[0];
  
  const formatCurrency = (amount: number) => {
    const value = amount || 0;
    // For Naira and other non-decimal heavy currencies, we might want to handle decimals differently
    // but standard toFixed(2) is usually fine.
    return `${currencyData.symbol}${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  return {
    currencyCode: currencyData.code,
    currencySymbol: currencyData.symbol,
    formatCurrency,
  };
}
