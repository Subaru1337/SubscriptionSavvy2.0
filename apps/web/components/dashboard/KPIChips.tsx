"use client";

import { useSubscriptionStore } from "@/lib/store";
import { formatCurrency, toMonthlyCost, getUrgency } from "@/lib/utils";
import { AnimatedNumber } from "@/components/ui/AnimatedNumber";
import { TrendingUp, AlertCircle, Clock } from "lucide-react";

export function KPIChips() {
  const { subscriptions, settings } = useSubscriptionStore();
  const baseCurrency = settings?.base_currency || "INR";

  const totalMonthly = subscriptions
    .filter((s) => s.status === "active")
    .reduce((acc, s) => acc + toMonthlyCost(s.cost, s.billing_cycle), 0);

  const totalYearly = totalMonthly * 12;

  const dueThisWeek = subscriptions.filter((s) => {
    if (s.status !== "active") return false;
    const urgency = getUrgency(s.next_payment);
    return urgency === "today" || urgency === "soon" || urgency === "upcoming";
  }).length;

  return (
    <div className="flex gap-4 overflow-x-auto pb-4 mb-4 snap-x snap-mandatory hide-scrollbar">
      {/* Monthly Spend */}
      <div className="card p-5 min-w-[240px] flex-1 snap-start relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-10">
          <TrendingUp size={64} />
        </div>
        <p className="text-muted text-sm font-medium mb-1">Monthly Spend</p>
        <div className="text-3xl font-bold text-amber">
          <AnimatedNumber value={totalMonthly} currency={baseCurrency} />
        </div>
        <p className="text-muted text-xs mt-2">
          ≈ {formatCurrency(totalYearly, baseCurrency, true)} yearly
        </p>
      </div>

      {/* Due this week */}
      <div className="card p-5 min-w-[200px] snap-start relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-10">
          <Clock size={64} />
        </div>
        <p className="text-muted text-sm font-medium mb-1">Due within 7 days</p>
        <div className="text-3xl font-bold text-text mt-1">{dueThisWeek}</div>
        <p className="text-muted text-xs mt-2">
          {dueThisWeek === 0 ? "You're all clear!" : "Check reminders"}
        </p>
      </div>

      {/* Active Subs */}
      <div className="card p-5 min-w-[200px] snap-start relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-10">
          <AlertCircle size={64} />
        </div>
        <p className="text-muted text-sm font-medium mb-1">Active Tracked</p>
        <div className="text-3xl font-bold text-text mt-1">
          {subscriptions.filter((s) => s.status === "active").length}
        </div>
        <p className="text-muted text-xs mt-2">Across all categories</p>
      </div>
    </div>
  );
}
