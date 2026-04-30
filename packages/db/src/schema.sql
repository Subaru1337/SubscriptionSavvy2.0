-- ============================================================
-- SubscriptionSavvy 2.0 — Supabase Schema
-- Paste this into the Supabase SQL Editor and run
-- ============================================================

-- Enable UUID extension (usually already enabled)
create extension if not exists "pgcrypto";

-- ─── Subscriptions ────────────────────────────────────────────────────────────
create table if not exists subscriptions (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid references auth.users not null,
  name           text not null,
  category       text not null default 'other',
  cost           numeric(10,2) not null,
  currency       text not null default 'INR',
  billing_cycle  text not null default 'monthly',
  next_payment   date not null,
  trial_ends_on  date,
  status         text not null default 'active',
  notes          text,
  logo_color     text,
  created_at     timestamptz not null default now()
);

-- ─── Payment History ─────────────────────────────────────────────────────────
create table if not exists payment_history (
  id              uuid primary key default gen_random_uuid(),
  subscription_id uuid references subscriptions on delete cascade not null,
  user_id         uuid references auth.users not null,
  amount          numeric(10,2) not null,
  currency        text not null default 'INR',
  paid_at         timestamptz not null default now()
);

-- ─── User Settings ────────────────────────────────────────────────────────────
create table if not exists user_settings (
  user_id              uuid primary key references auth.users,
  base_currency        text not null default 'INR',
  monthly_budget       numeric(10,2),
  email_reminders      boolean not null default true,
  reminder_days_before int not null default 3,
  display_name         text,
  theme                text not null default 'dark'
);

-- ─── Row Level Security ───────────────────────────────────────────────────────
alter table subscriptions   enable row level security;
alter table payment_history enable row level security;
alter table user_settings   enable row level security;

-- Subscriptions policies
create policy "Users can view own subscriptions"
  on subscriptions for select
  using (auth.uid() = user_id);

create policy "Users can insert own subscriptions"
  on subscriptions for insert
  with check (auth.uid() = user_id);

create policy "Users can update own subscriptions"
  on subscriptions for update
  using (auth.uid() = user_id);

create policy "Users can delete own subscriptions"
  on subscriptions for delete
  using (auth.uid() = user_id);

-- Payment history policies
create policy "Users can view own payment history"
  on payment_history for select
  using (auth.uid() = user_id);

create policy "Users can insert own payment history"
  on payment_history for insert
  with check (auth.uid() = user_id);

-- User settings policies
create policy "Users can view own settings"
  on user_settings for select
  using (auth.uid() = user_id);

create policy "Users can upsert own settings"
  on user_settings for insert
  with check (auth.uid() = user_id);

create policy "Users can update own settings"
  on user_settings for update
  using (auth.uid() = user_id);

-- ─── Auto-create user settings on signup ─────────────────────────────────────
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.user_settings (user_id)
  values (new.id)
  on conflict (user_id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
