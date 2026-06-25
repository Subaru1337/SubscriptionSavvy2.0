import { useState, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';
import { api } from './api';

// Module-level cache so all screens share one fetch per session
let cachedCurrency: string | null = null;
let listeners: Array<(c: string) => void> = [];

function notify(currency: string) {
  cachedCurrency = currency;
  listeners.forEach((fn) => fn(currency));
}

/** Fetch base currency from settings API and update cache */
export async function refreshBaseCurrency(): Promise<string> {
  try {
    const res = await api.get('/settings');
    const currency = res.data?.user?.baseCurrency ?? 'INR';
    notify(currency);
    return currency;
  } catch {
    return cachedCurrency ?? 'INR';
  }
}

/**
 * Hook — returns the user's base currency code.
 * Re-renders all consumers whenever the currency changes.
 */
export function useBaseCurrency(): string {
  const [currency, setCurrency] = useState<string>(cachedCurrency ?? 'INR');

  useEffect(() => {
    // Subscribe to future changes
    listeners.push(setCurrency);

    // If not cached yet, fetch now
    if (!cachedCurrency) {
      refreshBaseCurrency().then(setCurrency);
    } else {
      setCurrency(cachedCurrency);
    }

    return () => {
      listeners = listeners.filter((fn) => fn !== setCurrency);
    };
  }, []);

  return currency;
}
