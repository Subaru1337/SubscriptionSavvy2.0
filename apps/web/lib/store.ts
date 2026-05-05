"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export type BillingCycle = "monthly" | "yearly" | "weekly" | "custom";
export type SubscriptionStatus = "active" | "cancelled" | "paused";
export type CategoryType =
  | "entertainment" | "productivity" | "health"
  | "cloud" | "finance" | "education"
  | "social" | "gaming" | "food" | "other";

export interface Subscription {
  id: string;
  user_id: string;
  name: string;
  category: CategoryType;
  cost: number;
  currency: string;
  billing_cycle: BillingCycle;
  next_payment: string;
  trial_ends_on: string | null;
  status: SubscriptionStatus;
  notes: string | null;
  logo_color: string | null;
  created_at: string;
}

export interface UserSettings {
  user_id: string;
  base_currency: string;
  monthly_budget: number | null;
  email_reminders: boolean;
  reminder_days_before: number;
  display_name: string | null;
  theme: "dark" | "light";
}

interface SubscriptionStore {
  subscriptions: Subscription[];
  settings: UserSettings | null;
  isLoading: boolean;
  setSubscriptions: (subs: Subscription[]) => void;
  addSubscription: (sub: Subscription) => void;
  updateSubscription: (id: string, update: Partial<Subscription>) => void;
  removeSubscription: (id: string) => void;
  setSettings: (settings: UserSettings) => void;
  setLoading: (loading: boolean) => void;
}

export const useSubscriptionStore = create<SubscriptionStore>()(
  persist(
    (set) => ({
      subscriptions: [],
      settings: null,
      isLoading: false,
      setSubscriptions: (subs) => set({ subscriptions: subs }),
      addSubscription: (sub) =>
        set((s) => ({ subscriptions: [sub, ...s.subscriptions] })),
      updateSubscription: (id, update) =>
        set((s) => ({
          subscriptions: s.subscriptions.map((sub) =>
            sub.id === id ? { ...sub, ...update } : sub
          ),
        })),
      removeSubscription: (id) =>
        set((s) => ({
          subscriptions: s.subscriptions.filter((sub) => sub.id !== id),
        })),
      setSettings: (settings) => set({ settings }),
      setLoading: (loading) => set({ isLoading: loading }),
    }),
    { name: "subscriptionsavvy-store" }
  )
);
