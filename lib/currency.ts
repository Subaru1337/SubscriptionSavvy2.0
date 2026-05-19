// Frankfurter API currency conversion with 24-hour in-memory cache

const FRANKFURTER_BASE = 'https://api.frankfurter.app/latest';

type RatesResponse = {
  rates: Record<string, number>;
  base: string;
};

export const SUPPORTED_CURRENCIES = ["INR", "USD", "EUR", "GBP", "AED", "SGD", "AUD", "CAD"] as const;
export type Currency = (typeof SUPPORTED_CURRENCIES)[number];

export const CURRENCY_SYMBOLS: Record<string, string> = {
  INR: "₹",
  USD: "$",
  EUR: "€",
  GBP: "£",
  AED: "د.إ",
  SGD: "S$",
  AUD: "A$",
  CAD: "C$",
};

export async function getRates(baseCurrency: string): Promise<Record<string, number>> {
  const res = await fetch(`${FRANKFURTER_BASE}?base=${baseCurrency}`, {
    next: { revalidate: 86400 }, // Cache at the edge for 24 hours — survives cold starts
  });

  if (!res.ok) {
    console.error('Frankfurter API error:', res.status);
    return {}; // Return empty rates — callers should handle gracefully
  }

  const data: RatesResponse = await res.json();
  return { ...data.rates, [baseCurrency]: 1 };
}

export async function convertAmount(
  amount: number,
  fromCurrency: string,
  toCurrency: string
): Promise<number> {
  if (fromCurrency === toCurrency) return amount;

  const rates = await getRates(fromCurrency);

  if (!rates[toCurrency]) {
    console.warn(`No rate found for ${fromCurrency} -> ${toCurrency}`);
    return amount; // Fallback: return unconverted
  }

  return amount * rates[toCurrency];
}

export async function getRatesForBase(base: string): Promise<Record<string, number>> {
  return getRates(base);
}

export function formatAmount(amount: number, currency: string): string {
  const symbol = CURRENCY_SYMBOLS[currency] || currency;
  return `${symbol}${amount.toLocaleString("en-IN", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;
}

export function formatCurrencyCode(currency: string): string {
  return CURRENCY_SYMBOLS[currency] || currency;
}
