const SYMBOLS: Record<string, string> = {
  USD: '$', EUR: '€', GBP: '£', NGN: '₦', GHS: '₵',
  KES: 'KSh', ZAR: 'R', UGX: 'USh', TZS: 'TSh', RWF: 'Fr',
};

const currencyService = {
  getSymbol(currency: string): string {
    return SYMBOLS[currency?.toUpperCase()] || currency || '$';
  },

  format(amount: number, currency = 'USD'): string {
    const symbol = this.getSymbol(currency);
    return `${symbol}${Number(amount).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  },

  isAfrican(currency: string): boolean {
    const african = ['NGN', 'GHS', 'KES', 'ZAR', 'UGX', 'TZS', 'RWF', 'EGP', 'MAD'];
    return african.includes(currency?.toUpperCase());
  },
};

export default currencyService;
