"use client";

import { useSubscriptionStore } from "@/lib/store";
import { formatCurrency, toMonthlyCost, CATEGORY_COLORS } from "@/lib/utils";

export function CategoryBars() {
  const { subscriptions, settings } = useSubscriptionStore();
  const baseCurrency = settings?.base_currency || "INR";

  const activeSubs = subscriptions.filter(s => s.status === "active");
  const totalMonthly = activeSubs.reduce((acc, s) => acc + toMonthlyCost(s.cost, s.billing_cycle), 0);

  if (activeSubs.length === 0) return null;

  const categoryMap = new Map<string, number>();
  activeSubs.forEach(s => {
    const cost = toMonthlyCost(s.cost, s.billing_cycle);
    categoryMap.set(s.category, (categoryMap.get(s.category) || 0) + cost);
  });

  const data = Array.from(categoryMap.entries())
    .map(([category, value]) => ({
      category,
      value,
      pct: (value / totalMonthly) * 100
    }))
    .sort((a, b) => b.value - a.value);

  return (
    <div className="card p-6 h-full">
      <h3 className="text-title mb-6">Spend by Category</h3>
      
      <div className="space-y-5">
        {data.map((item, i) => (
          <div key={item.category} className="animate-slide-up" style={{ animationDelay: `${i * 100}ms` }}>
            <div className="flex justify-between text-sm mb-2">
              <span className="capitalize font-semibold text-text">{item.category}</span>
              <span className="text-muted">
                <span className="font-bold text-text">{formatCurrency(item.value, baseCurrency)}</span>
                <span className="text-xs ml-1">/mo</span>
              </span>
            </div>
            <div className="w-full h-2.5 rounded-full bg-[rgba(240,246,252,0.05)] overflow-hidden">
              <div 
                className="h-full rounded-full transition-all duration-1000 ease-out"
                style={{ 
                  width: `${item.pct}%`, 
                  backgroundColor: CATEGORY_COLORS[item.category as keyof typeof CATEGORY_COLORS] || CATEGORY_COLORS.other 
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
