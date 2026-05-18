"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";
import { AlertTriangle, TrendingUp, Settings, Clock } from "lucide-react";
import { CardSkeleton } from "@/components/ui/Skeleton";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { formatDate, formatDateShort } from "@/lib/utils";
import { CURRENCY_SYMBOLS } from "@/lib/currency";

interface AnalyticsSummary {
  monthly_total: number;
  annual_total: number;
  active_subscriptions: number;
  budget_used_percent: number | null;
  trials_expiring_soon: number;
}

interface CategoryBreakdown {
  category: string;
  count: number;
  monthly_total: number;
}

interface TrendData {
  month: string;
  label: string;
  total: number;
}

interface User {
  baseCurrency: string;
  monthlyBudget: string | null;
}

interface Subscription {
  id: string;
  name: string;
  cost: string;
  currency: string;
  nextPayment: string;
  billingCycle: string;
}

const CHART_COLORS = [
  "#0D7377", "#14A085", "#2ECC7A", "#0f9898", "#1ab87e",
  "#08545a", "#0e8a6e", "#1fd4a0",
];

const BUDGET_COLOR = (percent: number) =>
  percent >= 90 ? "#E05C5C" : percent >= 75 ? "#c9a227" : "#2ECC7A";

export default function DashboardPage() {
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [categories, setCategories] = useState<CategoryBreakdown[]>([]);
  const [trends, setTrends] = useState<TrendData[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [dueSoon, setDueSoon] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadAll() {
      try {
        const [summaryRes, catRes, trendRes, userRes, subsRes] = await Promise.all([
          fetch("/api/analytics/summary"),
          fetch("/api/analytics/category-breakdown"),
          fetch("/api/analytics/trends"),
          fetch("/api/auth/me"),
          fetch("/api/subscriptions"),
        ]);

        const [summaryData, catData, trendData, userData, subsData] = await Promise.all([
          summaryRes.json(),
          catRes.json(),
          trendRes.json(),
          userRes.json(),
          subsRes.json(),
        ]);

        setSummary(summaryData);
        setCategories(catData);
        setTrends(trendData);
        setUser(userData.user);

        // Due in next 7 days
        if (subsData.subscriptions) {
          const today = new Date();
          const in7 = new Date(today);
          in7.setDate(in7.getDate() + 7);
          const due = subsData.subscriptions.filter((s: Subscription) => {
            const d = new Date(s.nextPayment);
            return d <= in7;
          });
          setDueSoon(due);
        }
      } catch (err) {
        console.error("Dashboard load error:", err);
      } finally {
        setLoading(false);
      }
    }
    loadAll();
  }, []);

  const currencySymbol = user ? (CURRENCY_SYMBOLS[user.baseCurrency] || user.baseCurrency) : "₹";
  const budgetPercent = summary?.budget_used_percent;
  const hasMultipleCurrencies = categories.length > 1;

  function formatAmount(n: number) {
    return `${currencySymbol}${n.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
  }

  if (loading) {
    return (
      <div className="page-container">
        <div className="h-8 skeleton w-40 mb-6" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <CardSkeleton /><CardSkeleton /><CardSkeleton />
        </div>
        <div className="skeleton h-20 rounded-xl mb-6" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="skeleton h-80 rounded-xl" />
          <div className="skeleton h-80 rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="page-container animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>Dashboard</h1>
        {hasMultipleCurrencies && (
          <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
            All amounts converted to {user?.baseCurrency}
          </p>
        )}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="card">
          <p className="text-xs font-medium mb-1" style={{ color: "var(--text-secondary)" }}>Monthly Spend</p>
          <p className="text-3xl font-bold font-mono" style={{ color: "var(--primary)" }}>
            {formatAmount(summary?.monthly_total || 0)}
          </p>
          <p className="text-xs mt-1" style={{ color: "var(--text-secondary)" }}>per month</p>
        </div>
        <div className="card">
          <p className="text-xs font-medium mb-1" style={{ color: "var(--text-secondary)" }}>Annual Projection</p>
          <p className="text-3xl font-bold font-mono" style={{ color: "var(--text-primary)" }}>
            {formatAmount(summary?.annual_total || 0)}
          </p>
          <p className="text-xs mt-1" style={{ color: "var(--text-secondary)" }}>per year</p>
        </div>
        <div className="card">
          <p className="text-xs font-medium mb-1" style={{ color: "var(--text-secondary)" }}>Active Subscriptions</p>
          <p className="text-3xl font-bold font-mono" style={{ color: "var(--text-primary)" }}>
            {summary?.active_subscriptions || 0}
          </p>
          <p className="text-xs mt-1" style={{ color: "var(--text-secondary)" }}>services tracked</p>
        </div>
      </div>

      {/* Budget Bar */}
      {user?.monthlyBudget ? (
        <div className="card mb-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
              {formatAmount(summary?.monthly_total || 0)} of {formatAmount(Number(user.monthlyBudget))} monthly budget used
            </p>
            <span
              className="text-sm font-bold font-mono"
              style={{ color: BUDGET_COLOR(budgetPercent || 0) }}
            >
              {budgetPercent?.toFixed(1)}%
            </span>
          </div>
          <div className="h-3 rounded-full overflow-hidden" style={{ backgroundColor: "var(--border)" }}>
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${Math.min(budgetPercent || 0, 100)}%`,
                backgroundColor: BUDGET_COLOR(budgetPercent || 0),
              }}
            />
          </div>
          {(budgetPercent || 0) >= 90 && (
            <p className="text-xs mt-2 flex items-center gap-1" style={{ color: "var(--warning)" }}>
              <AlertTriangle size={12} /> You&#39;re close to your budget limit
            </p>
          )}
        </div>
      ) : (
        <div
          className="card mb-6 flex items-center justify-between"
          style={{ borderStyle: "dashed" }}
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: "var(--tag-bg)" }}>
              <TrendingUp size={16} style={{ color: "var(--primary)" }} />
            </div>
            <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
              Set a monthly budget to track your spending limit
            </p>
          </div>
          <Link href="/settings" className="btn-secondary text-xs">
            <Settings size={14} />
            Set Budget
          </Link>
        </div>
      )}

      {/* Trials Warning */}
      {(summary?.trials_expiring_soon || 0) > 0 && (
        <div
          className="card mb-6 flex items-center gap-3"
          style={{ backgroundColor: "rgba(224, 92, 92, 0.08)", borderColor: "rgba(224, 92, 92, 0.2)" }}
        >
          <AlertTriangle size={18} style={{ color: "var(--warning)" }} />
          <div>
            <p className="text-sm font-medium" style={{ color: "var(--warning)" }}>
              {summary?.trials_expiring_soon} trial{(summary?.trials_expiring_soon || 0) > 1 ? "s" : ""} expiring this week
            </p>
            <Link href="/reminders" className="text-xs underline" style={{ color: "var(--warning)" }}>
              View reminders →
            </Link>
          </div>
        </div>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Pie Chart */}
        <div className="card">
          <p className="section-title">Spending by Category</p>
          {categories.length === 0 ? (
            <div className="h-48 flex items-center justify-center" style={{ color: "var(--text-secondary)" }}>
              No data yet
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={categories}
                  dataKey="monthly_total"
                  nameKey="category"
                  cx="50%"
                  cy="50%"
                  outerRadius={90}
                  innerRadius={45}
                  paddingAngle={2}
                >
                  {categories.map((_, i) => (
                    <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(v: number) => [formatAmount(v), "Monthly"]}
                  contentStyle={{ borderRadius: 8, border: "1px solid var(--border)", background: "var(--card)", color: "var(--text-primary)" }}
                />
                <Legend
                  formatter={(value) => (
                    <span style={{ color: "var(--text-secondary)", fontSize: "12px" }}>{value}</span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Line Chart */}
        <div className="card">
          <p className="section-title">6-Month Spending Trend</p>
          {trends.every((t) => t.total === 0) ? (
            <div className="h-48 flex items-center justify-center" style={{ color: "var(--text-secondary)" }}>
              No payment history yet
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={trends} margin={{ top: 5, right: 10, bottom: 5, left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 11, fill: "var(--text-secondary)" }}
                  tickFormatter={(v) => v.split(" ")[0]}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "var(--text-secondary)" }}
                  tickFormatter={(v) => `${currencySymbol}${(v / 1000).toFixed(0)}k`}
                />
                <Tooltip
                  formatter={(v: number) => [formatAmount(v), "Total"]}
                  contentStyle={{ borderRadius: 8, border: "1px solid var(--border)", background: "var(--card)", color: "var(--text-primary)" }}
                />
                <Line
                  type="monotone"
                  dataKey="total"
                  stroke="var(--primary)"
                  strokeWidth={2.5}
                  dot={{ fill: "var(--primary)", r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Breakdown */}
        <div className="card">
          <p className="section-title">Category Breakdown</p>
          {categories.length === 0 ? (
            <p className="text-sm text-center py-8" style={{ color: "var(--text-secondary)" }}>
              Add subscriptions to see breakdown
            </p>
          ) : (
            <div className="space-y-3">
              {categories.map((cat, i) => (
                <div key={cat.category} className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div
                      className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }}
                    />
                    <span className="text-sm" style={{ color: "var(--text-primary)" }}>{cat.category}</span>
                    <span className="text-xs px-1.5 py-0.5 rounded" style={{ backgroundColor: "var(--tag-bg)", color: "var(--text-secondary)" }}>
                      {cat.count}
                    </span>
                  </div>
                  <span className="font-mono text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                    {formatAmount(cat.monthly_total)}/mo
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Due This Week */}
        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <Clock size={16} style={{ color: "var(--primary)" }} />
            <p className="section-title !mb-0">Due This Week</p>
          </div>
          {dueSoon.length === 0 ? (
            <p className="text-sm text-center py-8" style={{ color: "var(--text-secondary)" }}>
              No payments due this week 🎉
            </p>
          ) : (
            <div className="space-y-2">
              {dueSoon.map((sub) => (
                <div
                  key={sub.id}
                  className="flex items-center justify-between py-2 border-b last:border-0"
                  style={{ borderColor: "var(--border)" }}
                >
                  <div>
                    <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{sub.name}</p>
                    <p className="text-xs" style={{ color: "var(--text-secondary)" }}>{formatDateShort(sub.nextPayment)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                      {CURRENCY_SYMBOLS[sub.currency] || sub.currency}{Number(sub.cost).toLocaleString()}
                    </span>
                    <StatusBadge nextPayment={sub.nextPayment} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
