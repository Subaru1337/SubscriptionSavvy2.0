"use client";

import { useSubscriptionStore } from "@/lib/store";
import { formatCurrency, toMonthlyCost } from "@/lib/utils";

export function BudgetBar() {
  const { subscriptions, settings } = useSubscriptionStore();
  
  if (!settings?.monthly_budget) return null;

  const budget = settings.monthly_budget;
  const baseCurrency = settings.base_currency || "INR";

  const totalMonthly = subscriptions
    .filter((s) => s.status === "active")
    .reduce((acc, s) => acc + toMonthlyCost(s.cost, s.billing_cycle), 0);

  const pct = Math.min((totalMonthly / budget) * 100, 100);
  
  let barColor = "var(--color-success)";
  if (pct >= 100) barColor = "var(--color-danger)";
  else if (pct >= 80) barColor = "var(--color-warning)";

  return (
    <div className="card p-6 h-full flex flex-col justify-center">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-title">Monthly Budget</h3>
        <span className="text-sm font-semibold" style={{ color: barColor }}>
          {pct.toFixed(1)}% Used
        </span>
      </div>
      
      <div className="w-full h-3 rounded-full bg-[rgba(240,246,252,0.05)] overflow-hidden mb-3">
        <div 
          className="h-full rounded-full transition-all duration-1000 ease-out"
          style={{ width: `${pct}%`, backgroundColor: barColor }}
        />
      </div>

      <div className="flex items-center justify-between text-sm">
        <span className="text-text font-bold">{formatCurrency(totalMonthly, baseCurrency)}</span>
        <span className="text-muted">of {formatCurrency(budget, baseCurrency)}</span>
      </div>
    </div>
  );
}
