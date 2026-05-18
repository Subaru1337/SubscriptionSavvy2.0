"use client";

import { useSubscriptionStore } from "@/lib/store";
import { formatCurrency, toMonthlyCost, getCurrencySymbol } from "@/lib/utils";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { EmptyState } from "@/components/ui/EmptyState";
import { TrendingUp } from "lucide-react";

export function TrendLine() {
  const { subscriptions, settings } = useSubscriptionStore();
  const baseCurrency = settings?.base_currency || "INR";

  const activeSubs = subscriptions.filter(s => s.status === "active");

  if (activeSubs.length === 0) {
    return (
      <div className="card p-6 h-[400px] flex items-center justify-center">
        <EmptyState
          icon={TrendingUp}
          title="No Trend Data"
          description="Add subscriptions to start tracking your spending trends."
        />
      </div>
    );
  }

  // Generate mock 6-month data based on current active subs (assuming constant spend for demo)
  // In a real app, this would use the payment_history table
  const totalMonthly = activeSubs.reduce((acc, s) => acc + toMonthlyCost(s.cost, s.billing_cycle), 0);
  
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"];
  const data = months.map((m, i) => {
    // Add slight random variance for visual effect
    const variance = totalMonthly * (0.9 + (i * 0.05)); 
    return { name: m, spend: Math.round(variance) };
  });

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="glass p-3 rounded-xl shadow-lg border border-[rgba(240,246,252,0.1)]">
          <p className="text-muted text-xs font-semibold mb-1 uppercase tracking-wider">{label}</p>
          <p className="text-xl font-bold text-amber">
            {formatCurrency(payload[0].value, baseCurrency)}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="card p-6 h-[400px] flex flex-col">
      <h3 className="text-title mb-1">6-Month Trend</h3>
      <p className="text-muted text-sm mb-6">Estimated spend based on active subscriptions</p>
      
      <div className="flex-1 w-full relative">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorSpend" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#0D7377" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#0D7377" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} />
            <XAxis 
              dataKey="name" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: '#8B949E', fontSize: 12 }} 
              dy={10}
            />
            <YAxis 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: '#8B949E', fontSize: 12 }}
              tickFormatter={(val) => `${getCurrencySymbol(baseCurrency)}${val >= 1000 ? (val/1000).toFixed(1)+'k' : val}`}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(13,115,119,0.2)', strokeWidth: 2, strokeDasharray: '4 4' }} />
            <Area 
              type="monotone" 
              dataKey="spend" 
              stroke="#0D7377" 
              strokeWidth={3}
              fillOpacity={1} 
              fill="url(#colorSpend)" 
              animationDuration={1500}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
