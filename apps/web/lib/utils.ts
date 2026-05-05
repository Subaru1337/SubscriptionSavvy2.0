import type { BillingCycle, CategoryType } from "@/lib/store";

export type UrgencyLevel = "overdue" | "today" | "soon" | "upcoming" | "normal";

export function daysUntil(dateStr: string): number {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const target = new Date(dateStr);
  target.setHours(0, 0, 0, 0);
  return Math.round((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

export function getUrgency(nextPayment: string): UrgencyLevel {
  const d = daysUntil(nextPayment);
  if (d < 0)  return "overdue";
  if (d === 0) return "today";
  if (d <= 3)  return "soon";
  if (d <= 7)  return "upcoming";
  return "normal";
}

export const URGENCY_COLORS: Record<UrgencyLevel, string> = {
  overdue:  "#F85149",
  today:    "#E3B341",
  soon:     "#F5A623",
  upcoming: "#2A9D8F",
  normal:   "#8B949E",
};

export const URGENCY_LABELS: Record<UrgencyLevel, string> = {
  overdue:  "Overdue",
  today:    "Due Today",
  soon:     "Due Soon",
  upcoming: "Upcoming",
  normal:   "Scheduled",
};

export function formatCurrency(amount: number, currency = "INR", compact = false): string {
  const symbols: Record<string, string> = {
    INR: "₹", USD: "$", EUR: "€", GBP: "£", JPY: "¥",
    CAD: "CA$", AUD: "A$", SGD: "S$",
  };
  const sym = symbols[currency] ?? currency + " ";
  if (compact && amount >= 1000) return `${sym}${(amount / 1000).toFixed(1)}k`;
  return `${sym}${amount.toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

export function toMonthlyCost(cost: number, cycle: BillingCycle): number {
  switch (cycle) {
    case "weekly":  return cost * 4.33;
    case "monthly": return cost;
    case "yearly":  return cost / 12;
    default:        return cost;
  }
}

export function toYearlyCost(cost: number, cycle: BillingCycle): number {
  switch (cycle) {
    case "weekly":  return cost * 52;
    case "monthly": return cost * 12;
    case "yearly":  return cost;
    default:        return cost;
  }
}

export function billingLabel(cycle: BillingCycle): string {
  return { weekly: "/wk", monthly: "/mo", yearly: "/yr", custom: "" }[cycle];
}

export function formatDate(dateStr: string, short = false): string {
  const d = new Date(dateStr);
  if (short) return d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
}

export function getInitials(name: string): string {
  return name.split(/\s+/).slice(0, 2).map((w) => w[0]).join("").toUpperCase();
}

export const CATEGORY_COLORS: Record<CategoryType, string> = {
  entertainment: "#F5A623", productivity: "#2A9D8F", health: "#3FB950",
  cloud: "#58A6FF", finance: "#BC8CFF", education: "#FFA657",
  social: "#FF7B72", gaming: "#E3B341", food: "#F85149", other: "#8B949E",
};

export const CATEGORY_ICONS: Record<CategoryType, string> = {
  entertainment: 'play-circle',
  productivity:  'briefcase',
  health:        'heart',
  cloud:         'cloud',
  finance:       'trending-up',
  education:     'book',
  social:        'users',
  gaming:        'gamepad-2',
  food:          'utensils',
  other:         'grid',
};

export function getCurrencySymbol(currency: string): string {
  const symbols: Record<string, string> = {
    INR: "₹", USD: "$", EUR: "€", GBP: "£", JPY: "¥",
    CAD: "CA$", AUD: "A$", SGD: "S$",
  };
  return symbols[currency] ?? currency;
}

export const LOGO_COLORS = [
  "#F5A623", "#2A9D8F", "#58A6FF", "#3FB950",
  "#BC8CFF", "#FF7B72", "#E3B341", "#F85149", "#79C0FF", "#FFA657",
];

export interface SubscriptionTemplate {
  name: string; category: CategoryType; cost: number;
  currency: string; billing_cycle: BillingCycle; logo_color: string;
}

export const TEMPLATES: SubscriptionTemplate[] = [
  { name: "Netflix",         category: "entertainment", cost: 649,  currency: "INR", billing_cycle: "monthly", logo_color: "#E50914" },
  { name: "Spotify",         category: "entertainment", cost: 119,  currency: "INR", billing_cycle: "monthly", logo_color: "#1DB954" },
  { name: "YouTube Premium", category: "entertainment", cost: 189,  currency: "INR", billing_cycle: "monthly", logo_color: "#FF0000" },
  { name: "Disney+ Hotstar", category: "entertainment", cost: 299,  currency: "INR", billing_cycle: "monthly", logo_color: "#113CCF" },
  { name: "Amazon Prime",    category: "entertainment", cost: 299,  currency: "INR", billing_cycle: "monthly", logo_color: "#FF9900" },
  { name: "Apple Music",     category: "entertainment", cost: 99,   currency: "INR", billing_cycle: "monthly", logo_color: "#FA243C" },
  { name: "iCloud+",         category: "cloud",         cost: 75,   currency: "INR", billing_cycle: "monthly", logo_color: "#147EFB" },
  { name: "Google One",      category: "cloud",         cost: 130,  currency: "INR", billing_cycle: "monthly", logo_color: "#4285F4" },
  { name: "Zomato Pro",      category: "food",          cost: 99,   currency: "INR", billing_cycle: "monthly", logo_color: "#E23744" },
  { name: "Swiggy One",      category: "food",          cost: 89,   currency: "INR", billing_cycle: "monthly", logo_color: "#FC8019" },
  { name: "Notion",          category: "productivity",  cost: 1600, currency: "INR", billing_cycle: "yearly",  logo_color: "#000000" },
  { name: "Figma",           category: "productivity",  cost: 1200, currency: "INR", billing_cycle: "monthly", logo_color: "#F24E1E" },
  { name: "GitHub Pro",      category: "productivity",  cost: 330,  currency: "INR", billing_cycle: "monthly", logo_color: "#24292F" },
  { name: "ChatGPT Plus",    category: "productivity",  cost: 1659, currency: "INR", billing_cycle: "monthly", logo_color: "#10A37F" },
  { name: "Adobe CC",        category: "productivity",  cost: 4230, currency: "INR", billing_cycle: "monthly", logo_color: "#FF0000" },
  { name: "Vercel Pro",      category: "cloud",         cost: 20,   currency: "USD", billing_cycle: "monthly", logo_color: "#000000" },
  { name: "Linear",          category: "productivity",  cost: 8,    currency: "USD", billing_cycle: "monthly", logo_color: "#5E6AD2" },
  { name: "Cursor Pro",      category: "productivity",  cost: 20,   currency: "USD", billing_cycle: "monthly", logo_color: "#2563EB" },
];
