// Frankfurter API currency conversion with 24-hour in-memory cache

interface RateCache {
  rates: Record<string, number>;
  base: string;
  fetchedAt: number;
}

const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours in ms
const cache: Map<string, RateCache> = new Map();

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

async function fetchRates(base: string): Promise<Record<string, number>> {
  const cached = cache.get(base);
  if (cached && Date.now() - cached.fetchedAt < CACHE_TTL) {
    return cached.rates;
  }

  try {
    const res = await fetch(`https://api.frankfurter.app/latest?base=${base}`, {
      next: { revalidate: 86400 }, // Next.js cache 24hr
    });

    if (!res.ok) throw new Error(`Frankfurter API error: ${res.status}`);

    const data = await res.json();
    const rates: Record<string, number> = { ...data.rates, [base]: 1 };

    cache.set(base, {
      rates,
      base,
      fetchedAt: Date.now(),
    });

    return rates;
  } catch (error) {
    console.error("Failed to fetch exchange rates:", error);
    // Return fallback 1:1 rates on error
    return Object.fromEntries(SUPPORTED_CURRENCIES.map((c) => [c, 1]));
  }
}

export async function convertAmount(
  amount: number,
  from: string,
  to: string
): Promise<number> {
  if (from === to) return amount;

  const rates = await fetchRates(from);
  const rate = rates[to];

  if (!rate) {
    console.warn(`No rate found for ${from} → ${to}, using 1:1`);
    return amount;
  }

  return amount * rate;
}

export async function getRatesForBase(base: string): Promise<Record<string, number>> {
  return fetchRates(base);
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
