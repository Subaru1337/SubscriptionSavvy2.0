// Currency symbol map
export const CURRENCY_SYMBOLS: Record<string, string> = {
  INR: '₹',
  USD: '$',
  EUR: '€',
  GBP: '£',
  AED: 'د.إ',
  SGD: 'S$',
  AUD: 'A$',
  CAD: 'C$',
};

export function getCurrencySymbol(currency: string): string {
  return CURRENCY_SYMBOLS[currency] ?? currency;
}

/**
 * Format an amount with the correct symbol.
 * e.g. formatAmount(1234.5, 'INR') => '₹1,235'
 */
export function formatAmount(amount: number, currency: string, decimals = 0): string {
  const sym = getCurrencySymbol(currency);
  return `${sym}${amount.toLocaleString('en-IN', { maximumFractionDigits: decimals, minimumFractionDigits: decimals })}`;
}
