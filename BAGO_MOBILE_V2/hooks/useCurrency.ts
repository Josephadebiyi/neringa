import { useAuth } from '../contexts/AuthContext';

const SYMBOLS: Record<string, string> = {
  USD: '$', EUR: '€', GBP: '£', NGN: '₦', GHS: '₵',
  KES: 'KSh', ZAR: 'R', UGX: 'USh', TZS: 'TSh', RWF: 'Fr',
};

export function useCurrency() {
  const { user } = useAuth();
  const currency: string = (user as any)?.preferredCurrency || 'USD';
  const symbol = SYMBOLS[currency] || currency;

  const formatCurrency = (amount: number) =>
    `${symbol}${Number(amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return { currency, symbol, formatCurrency };
}
