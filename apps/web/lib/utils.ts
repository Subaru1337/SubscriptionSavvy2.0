import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const CATEGORIES = [
  "Entertainment",
  "Productivity",
  "Health",
  "Education",
  "Finance",
  "Shopping",
  "Developer Tools",
  "Other",
] as const;

export type Category = (typeof CATEGORIES)[number];

export const BILLING_CYCLES = ["monthly", "yearly"] as const;
export type BillingCycle = (typeof BILLING_CYCLES)[number];

export const SUBSCRIPTION_STATUSES = ["active", "cancelled", "paused"] as const;
export type SubscriptionStatus = (typeof SUBSCRIPTION_STATUSES)[number];

export function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function formatDateShort(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
  });
}

export function getMonthlyAmount(cost: number, billingCycle: string): number {
  if (billingCycle === "yearly") return cost / 12;
  return cost;
}

export function getLogoUrl(name: string): string {
  const map: Record<string, string> = {
    "netflix": "netflix.com",
    "spotify": "spotify.com",
    "youtube": "youtube.com",
    "youtube premium": "youtube.com",
    "amazon": "amazon.com",
    "amazon prime": "amazon.com",
    "chatgpt": "openai.com",
    "chatgpt plus": "openai.com",
    "notion": "notion.so",
    "adobe": "adobe.com",
    "adobe creative cloud": "adobe.com",
    "aws": "aws.amazon.com",
    "github": "github.com",
    "github copilot": "github.com",
    "coursera": "coursera.org",
    "coursera plus": "coursera.org",
    "headspace": "headspace.com",
    "zerodha": "zerodha.com",
    "figma": "figma.com",
    "vercel": "vercel.com",
    "google": "google.com",
    "google one": "google.com",
    "apple": "apple.com",
    "apple music": "apple.com",
    "apple tv+": "apple.com",
    "hulu": "hulu.com",
    "disney": "disneyplus.com",
    "disney+": "disneyplus.com",
    "hbomax": "max.com",
    "hbo max": "max.com",
    "canva": "canva.com",
    "zoom": "zoom.us",
    "slack": "slack.com",
    "microsoft": "microsoft.com",
    "microsoft 365": "microsoft.com",
  };
  const key = name.toLowerCase().trim();
  const domain = map[key] || `${key.replace(/\s+/g, '')}.com`;
  // Using logo.uplead.com because it correctly returns a 404 for missing logos, 
  // allowing our <img onError> fallback to generate the beautiful letter avatars!
  return `https://logo.uplead.com/${domain}`;
}
