"use client";

import { useSubscriptionStore } from "@/lib/store";
import { formatCurrency, toMonthlyCost, CATEGORY_COLORS } from "@/lib/utils";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { EmptyState } from "@/components/ui/EmptyState";
import { PieChart as PieChartIcon } from "lucide-react";

export function SpendDonut() {
  const { subscriptions, settings } = useSubscriptionStore();
  const baseCurrency = settings?.base_currency || "INR";

  const activeSubs = subscriptions.filter((s) => s.status === "active");

  if (activeSubs.length === 0) {
    return (
      <div className="card p-6 h-full flex items-center justify-center">
        <EmptyState
          icon={PieChartIcon}
          title="No Data Yet"
          description="Add some subscriptions to see your spending breakdown."
        />
      </div>
    );
  }

  // Aggregate by category
  const categoryMap = new Map<string, number>();
  activeSubs.forEach((sub) => {
    const mCost = toMonthlyCost(sub.cost, sub.billing_cycle);
    categoryMap.set(sub.category, (categoryMap.get(sub.category) || 0) + mCost);
  });

  const data = Array.from(categoryMap.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="glass p-3 rounded-xl shadow-lg border border-[rgba(240,246,252,0.1)]">
          <p className="text-sm font-semibold capitalize mb-1" style={{ color: CATEGORY_COLORS[data.name as keyof typeof CATEGORY_COLORS] }}>
            {data.name}
          </p>
          <p className="text-lg font-bold">
            {formatCurrency(data.value, baseCurrency)}<span className="text-xs text-muted font-normal">/mo</span>
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="card p-6 flex flex-col h-full min-h-[300px]">
      <h3 className="text-title mb-4">Spend Breakdown</h3>
      <div className="flex-1 w-full relative min-h-[200px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={80}
              paddingAngle={4}
              dataKey="value"
              stroke="none"
              animationBegin={0}
              animationDuration={1000}
            >
              {data.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={CATEGORY_COLORS[entry.name as keyof typeof CATEGORY_COLORS] || CATEGORY_COLORS.other} 
                />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'transparent' }} />
          </PieChart>
        </ResponsiveContainer>
        {/* Center label */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-muted text-xs">Top Category</span>
          <span className="text-text font-bold capitalize">{data[0]?.name}</span>
        </div>
      </div>
      
      {/* Legend */}
      <div className="mt-4 flex flex-wrap justify-center gap-3">
        {data.slice(0, 4).map((entry) => (
          <div key={entry.name} className="flex items-center gap-1.5 text-xs">
            <div 
              className="w-2.5 h-2.5 rounded-full" 
              style={{ background: CATEGORY_COLORS[entry.name as keyof typeof CATEGORY_COLORS] || CATEGORY_COLORS.other }}
            />
            <span className="capitalize text-muted">{entry.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
