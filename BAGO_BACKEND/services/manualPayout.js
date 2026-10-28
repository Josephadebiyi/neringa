// Payouts that Bago's accounts team sends by bank transfer instead of through
// Flutterwave. The user links an IBAN; each withdrawal becomes a request the
// admin dashboard approves, pays by hand and marks paid.
export const MANUAL_PAYOUT_PROVIDER = 'manual_bank_transfer';

export function manualPayoutCurrencies() {
  return new Set(String(process.env.MANUAL_PAYOUT_CURRENCIES ?? 'EUR')
    .split(',').map((value) => value.trim().toUpperCase()).filter(Boolean));
}

export function isManualPayoutCurrency(currency) {
  return manualPayoutCurrencies().has(String(currency || '').trim().toUpperCase());
}

export function normalizeIban(value) {
  return String(value || '').replace(/\s+/g, '').toUpperCase();
}

// ISO 13616 check: country code, check digits, then mod-97 of the rearranged number.
export function isValidIban(value) {
  const iban = normalizeIban(value);
  if (!/^[A-Z]{2}\d{2}[A-Z0-9]{11,30}$/.test(iban)) return false;
  const rearranged = iban.slice(4) + iban.slice(0, 4);
  let remainder = 0;
  for (const char of rearranged) {
    const digits = /[A-Z]/.test(char) ? String(char.charCodeAt(0) - 55) : char;
    for (const digit of digits) remainder = (remainder * 10 + Number(digit)) % 97;
  }
  return remainder === 1;
}

export function normalizeBic(value) {
  return String(value || '').replace(/\s+/g, '').toUpperCase();
}

// ISO 9362: 4-letter bank, 2-letter country, 2-character location, optional 3-character branch.
export function isValidBic(value) {
  return /^[A-Z]{4}[A-Z]{2}[A-Z0-9]{2}([A-Z0-9]{3})?$/.test(normalizeBic(value));
}

export function maskIban(value) {
  const iban = normalizeIban(value);
  return iban.length > 8 ? `${iban.slice(0, 4)} •••• ${iban.slice(-4)}` : iban;
}
