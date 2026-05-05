"use client";

import { useSubscriptionStore } from "@/lib/store";
import { formatCurrency, toMonthlyCost, toYearlyCost } from "@/lib/utils";
import { ArrowUpRight, ArrowDownRight, Activity } from "lucide-react";

export function StatCards() {
  const { subscriptions, settings } = useSubscriptionStore();
  const baseCurrency = settings?.base_currency || "INR";

  const activeSubs = subscriptions.filter(s => s.status === "active");
  
  // Highest Sub
  let highestSub: any = null;
  let highestCost = 0;
  
  activeSubs.forEach(s => {
    const cost = toMonthlyCost(s.cost, s.billing_cycle);
    if (cost > highestCost) {
      highestCost = cost;
      highestSub = s;
    }
  });

  // Yearly Projection
  const yearlyTotal = activeSubs.reduce((acc, s) => acc + toYearlyCost(s.cost, s.billing_cycle), 0);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 h-full">
      <div className="card p-5 flex flex-col justify-center">
        <div className="w-10 h-10 rounded-lg bg-[rgba(248,81,73,0.1)] flex items-center justify-center mb-4">
          <ArrowUpRight size={20} className="text-danger" />
        </div>
        <p className="text-muted text-sm font-medium mb-1">Highest Expense</p>
        {highestSub ? (
          <>
            <p className="text-xl font-bold text-text mb-1 truncate">{highestSub.name}</p>
            <p className="text-amber font-semibold text-lg">
              {formatCurrency(highestCost, baseCurrency)}<span className="text-xs text-muted font-normal">/mo</span>
            </p>
          </>
        ) : (
          <p className="text-muted text-sm">No data yet</p>
        )}
      </div>

      <div className="card p-5 flex flex-col justify-center">
        <div className="w-10 h-10 rounded-lg bg-[rgba(42,157,143,0.1)] flex items-center justify-center mb-4">
          <Activity size={20} className="text-teal" />
        </div>
        <p className="text-muted text-sm font-medium mb-1">Annual Projection</p>
        <p className="text-3xl font-bold text-text mb-1">
          {formatCurrency(yearlyTotal, baseCurrency, true)}
        </p>
        <p className="text-muted text-xs">Estimated based on current</p>
      </div>
    </div>
  );
}
