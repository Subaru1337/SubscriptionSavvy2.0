export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

// ─── Database Types ────────────────────────────────────────────────────────────

export type BillingCycle = 'monthly' | 'yearly' | 'weekly' | 'custom';
export type SubscriptionStatus = 'active' | 'cancelled' | 'paused';
export type CategoryType =
  | 'entertainment'
  | 'productivity'
  | 'health'
  | 'cloud'
  | 'finance'
  | 'education'
  | 'social'
  | 'gaming'
  | 'food'
  | 'other';

export interface Subscription {
  id: string;
  user_id: string;
  name: string;
  category: CategoryType;
  cost: number;
  currency: string;
  billing_cycle: BillingCycle;
  next_payment: string; // ISO date string
  trial_ends_on: string | null;
  status: SubscriptionStatus;
  notes: string | null;
  logo_color: string | null;
  created_at: string;
}

export interface PaymentHistory {
  id: string;
  subscription_id: string;
  user_id: string;
  amount: number;
  currency: string;
  paid_at: string;
}

export interface UserSettings {
  user_id: string;
  base_currency: string;
  monthly_budget: number | null;
  email_reminders: boolean;
  reminder_days_before: number;
  display_name: string | null;
  theme: 'dark' | 'light';
}

// ─── Insert / Update Types ────────────────────────────────────────────────────

export type SubscriptionInsert = Omit<Subscription, 'id' | 'created_at' | 'user_id'>;
export type SubscriptionUpdate = Partial<SubscriptionInsert>;
export type UserSettingsUpdate = Partial<Omit<UserSettings, 'user_id'>>;

// ─── Computed / View Types ────────────────────────────────────────────────────

export interface SubscriptionWithConvertedCost extends Subscription {
  cost_in_base: number; // Converted to user's base currency
  monthly_cost: number; // Normalized to monthly for aggregation
}

export interface DashboardStats {
  total_monthly: number;
  total_yearly: number;
  active_count: number;
  trial_count: number;
  overdue_count: number;
  due_this_week: number;
  budget_used_pct: number | null;
  top_category: CategoryType | null;
}

export interface MonthlySpend {
  month: string; // YYYY-MM
  total: number;
}

export interface CategorySpend {
  category: CategoryType;
  total: number;
  count: number;
  pct: number;
}
