const CATEGORIES = [
  'Entertainment',
  'Productivity',
  'Health',
  'Education',
  'Finance',
  'Shopping',
  'Developer Tools',
  'Other',
] as const;

const CURRENCIES = ['USD', 'INR', 'EUR', 'GBP', 'AED', 'SGD', 'AUD', 'CAD'] as const;

export type SubscriptionFormState = {
  name: string;
  cost: string;
  currency: string;
  billingCycle: 'monthly' | 'yearly';
  category: string;
  nextPayment: string;
  status: string;
  notes: string;
  trialEndsOn: string;
  worthItRating: number;
};

function toIsoDate(dateStr: string): string | null {
  const trimmed = dateStr.trim();
  if (!trimmed) return null;
  const date = new Date(trimmed);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString();
}

function normalizeCategory(category: string): (typeof CATEGORIES)[number] {
  const match = CATEGORIES.find((c) => c.toLowerCase() === category.trim().toLowerCase());
  return match ?? 'Other';
}

function normalizeCurrency(currency: string): (typeof CURRENCIES)[number] {
  const upper = currency.trim().toUpperCase();
  return (CURRENCIES as readonly string[]).includes(upper)
    ? (upper as (typeof CURRENCIES)[number])
    : 'USD';
}

/** Matches the web app's SubscriptionModal request body shape. */
export function buildSubscriptionPayload(form: SubscriptionFormState) {
  const nextPaymentIso = toIsoDate(form.nextPayment);
  if (!nextPaymentIso) {
    throw new Error('Please enter a valid next payment date (YYYY-MM-DD).');
  }

  const trialIso = form.trialEndsOn.trim() ? toIsoDate(form.trialEndsOn) : null;
  if (form.trialEndsOn.trim() && !trialIso) {
    throw new Error('Please enter a valid trial end date (YYYY-MM-DD).');
  }

  const cost = Number(form.cost);
  if (!Number.isFinite(cost) || cost <= 0) {
    throw new Error('Cost must be a positive number.');
  }

  const billingCycle = form.billingCycle === 'yearly' ? 'yearly' : 'monthly';
  const status =
    form.status === 'paused' || form.status === 'cancelled' ? form.status : 'active';

  return {
    name: form.name.trim(),
    cost,
    currency: normalizeCurrency(form.currency),
    category: normalizeCategory(form.category),
    billingCycle,
    nextPayment: nextPaymentIso,
    trialEndsOn: trialIso,
    status,
    notes: form.notes.trim() || null,
    worthItRating: form.worthItRating > 0 ? form.worthItRating : null,
  };
}

export function subscriptionToFormState(sub: Record<string, unknown>): SubscriptionFormState {
  return {
    name: String(sub.name ?? ''),
    cost: String(sub.cost ?? ''),
    currency: normalizeCurrency(String(sub.currency ?? 'USD')),
    billingCycle: sub.billingCycle === 'yearly' ? 'yearly' : 'monthly',
    category: normalizeCategory(String(sub.category ?? 'Other')),
    nextPayment: sub.nextPayment ? String(sub.nextPayment).split('T')[0] : '',
    status: String(sub.status ?? 'active'),
    notes: sub.notes ? String(sub.notes) : '',
    trialEndsOn: sub.trialEndsOn ? String(sub.trialEndsOn).split('T')[0] : '',
    worthItRating: typeof sub.worthItRating === 'number' ? sub.worthItRating : 0,
  };
}
