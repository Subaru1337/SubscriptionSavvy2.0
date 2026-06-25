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

const rateCache = new Map<string, { rates: Record<string, number>, timestamp: number }>();
const CACHE_DURATION = 1000 * 60 * 60; // 1 hour

export async function getRates(baseCurrency: string): Promise<Record<string, number>> {
  const now = Date.now();
  const cached = rateCache.get(baseCurrency);
  
  // Return from fast memory cache if valid
  if (cached && now - cached.timestamp < CACHE_DURATION) {
    return cached.rates;
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000); // Strict 2-second timeout

    const res = await fetch(`${FRANKFURTER_BASE}?base=${baseCurrency}`, {
      cache: 'no-store',
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (!res.ok) {
      console.error('Frankfurter API error:', res.status);
      return cached ? cached.rates : {}; 
    }

    const data: RatesResponse = await res.json();
    const rates = { ...data.rates, [baseCurrency]: 1 };
    
    // Save to memory cache
    rateCache.set(baseCurrency, { rates, timestamp: now });
    return rates;
  } catch (error) {
    console.error('Frankfurter API network error:', error);
    return cached ? cached.rates : {};
  }
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
