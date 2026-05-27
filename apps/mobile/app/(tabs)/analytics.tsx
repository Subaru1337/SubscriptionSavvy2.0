import {
  View, Text, ScrollView, ActivityIndicator, RefreshControl,
  TouchableOpacity, Alert
} from 'react-native';
import { useState, useEffect, useCallback } from 'react';
import { api } from '../../lib/api';
import { Feather } from '@expo/vector-icons';

type CategoryBreakdown = {
  category: string;
  count: number;
  monthly_total: number;
  budget_limit?: number | null;
  budget_used_percent?: number | null;
  over_budget?: boolean;
};

type HealthScore = {
  score: number;
  grade: string;
  deductions: { reason: string; points: number }[];
};

type Trend = { month: string; label: string; total: number };

type Nudge = {
  id: string;
  name: string;
  worthItRating: number;
  timesRenewed: number;
  totalSpent: number;
  currency: string;
  monthlyCost: number;
};

type AnnualRecap = {
  year: number;
  year_total: number;
  payment_count: number;
  top_category: string;
  most_expensive_sub: { name: string; total_paid: number } | null;
  avg_monthly: number;
  months_elapsed: number;
};

const GRADE_COLORS: Record<string, string> = {
  Excellent: '#10B981',
  Good: '#3B82F6',
  Fair: '#F59E0B',
  'Needs Attention': '#EF4444',
};

const CATEGORY_ICONS: Record<string, string> = {
  Entertainment: 'film',
  Productivity: 'zap',
  Health: 'heart',
  Education: 'book',
  Finance: 'credit-card',
  Shopping: 'shopping-bag',
  'Developer Tools': 'code',
  Other: 'grid',
};

export default function AnalyticsScreen() {
  const [loading, setLoading] = useState(true);
  const [breakdown, setBreakdown] = useState<CategoryBreakdown[]>([]);
  const [health, setHealth] = useState<HealthScore | null>(null);
  const [trends, setTrends] = useState<Trend[]>([]);
  const [nudges, setNudges] = useState<Nudge[]>([]);
  const [recap, setRecap] = useState<AnnualRecap | null>(null);
  const [baseCurrency, setBaseCurrency] = useState('USD');

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [breakdownRes, healthRes, trendsRes, nudgesRes, recapRes, settingsRes] =
        await Promise.allSettled([
          api.get('/analytics/category-breakdown'),
          api.get('/analytics/health-score'),
          api.get('/analytics/trends'),
          api.get('/analytics/nudges'),
          api.get('/analytics/annual-recap'),
          api.get('/settings'),
        ]);

      if (breakdownRes.status === 'fulfilled')
        setBreakdown(breakdownRes.value.data?.breakdown ?? breakdownRes.value.data ?? []);
      if (healthRes.status === 'fulfilled')
        setHealth(healthRes.value.data ?? null);
      if (trendsRes.status === 'fulfilled')
        setTrends(trendsRes.value.data?.trends ?? []);
      if (nudgesRes.status === 'fulfilled')
        setNudges(nudgesRes.value.data?.nudges ?? []);
      if (recapRes.status === 'fulfilled')
        setRecap(recapRes.value.data ?? null);
      if (settingsRes.status === 'fulfilled')
        setBaseCurrency(settingsRes.value.data?.user?.baseCurrency ?? 'USD');
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-background">
        <ActivityIndicator size="large" color="#0D7377" />
      </View>
    );
  }

  const gradeColor = health ? (GRADE_COLORS[health.grade] ?? '#6B6560') : '#6B6560';
  const maxTrend = Math.max(...trends.map((t) => t.total), 1);

  return (
    <ScrollView
      className="flex-1 bg-background"
      contentContainerStyle={{ padding: 16 }}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchData} />}
    >
      <Text className="text-2xl font-bold text-text-primary mb-4">Analytics</Text>

      {/* ── Health Score ─────────────────────────────── */}
      {health && (
        <View className="bg-card p-5 rounded-2xl border border-border mb-4">
          <Text className="text-text-secondary text-sm font-medium mb-3">🏥 Subscription Health</Text>
          <View className="flex-row items-center space-x-4">
            <View
              className="w-20 h-20 rounded-full items-center justify-center"
              style={{ borderWidth: 4, borderColor: gradeColor }}
            >
              <Text className="text-2xl font-bold" style={{ color: gradeColor }}>
                {health.score}
              </Text>
              <Text className="text-xs" style={{ color: gradeColor }}>/ 100</Text>
            </View>
            <View className="flex-1">
              <Text className="text-xl font-bold" style={{ color: gradeColor }}>
                {health.grade}
              </Text>
              {health.deductions.slice(0, 3).map((d, i) => (
                <View key={i} className="flex-row items-center space-x-1 mt-1">
                  <Feather name="minus-circle" size={12} color="#EF4444" />
                  <Text className="text-xs text-text-secondary flex-1" numberOfLines={1}>
                    {d.reason} ({d.points}pts)
                  </Text>
                </View>
              ))}
            </View>
          </View>
        </View>
      )}

      {/* ── Annual Recap ─────────────────────────────── */}
      {recap && (
        <View className="bg-card p-5 rounded-2xl border border-border mb-4">
          <Text className="text-text-secondary text-sm font-medium mb-3">📅 {recap.year} Annual Recap</Text>
          <View className="flex-row flex-wrap">
            {[
              { label: 'Total Spent', value: `${baseCurrency} ${Number(recap.year_total).toFixed(0)}` },
              { label: 'Payments Made', value: String(recap.payment_count) },
              { label: 'Avg / Month', value: `${baseCurrency} ${Number(recap.avg_monthly).toFixed(0)}` },
              { label: 'Top Category', value: recap.top_category ?? '—' },
            ].map(({ label, value }) => (
              <View key={label} className="w-1/2 mb-3 pr-2">
                <Text className="text-text-secondary text-xs">{label}</Text>
                <Text className="text-text-primary font-bold" numberOfLines={1}>{value}</Text>
              </View>
            ))}
          </View>
          {recap.most_expensive_sub && (
            <View className="mt-1 p-3 bg-background rounded-lg">
              <Text className="text-text-secondary text-xs">Most Expensive</Text>
              <Text className="text-text-primary font-bold">{recap.most_expensive_sub.name}</Text>
              <Text className="text-primary text-sm">
                {baseCurrency} {Number(recap.most_expensive_sub.total_paid).toFixed(2)} paid
              </Text>
            </View>
          )}
        </View>
      )}

      {/* ── Category Breakdown ───────────────────────── */}
      {breakdown.length > 0 && (
        <View className="bg-card p-5 rounded-2xl border border-border mb-4">
          <Text className="text-text-secondary text-sm font-medium mb-3">📊 Spending by Category</Text>
          {breakdown.map((cat) => {
            const icon = (CATEGORY_ICONS[cat.category] ?? 'grid') as any;
            const usedPct = cat.budget_used_percent ?? 0;
            const overBudget = cat.over_budget ?? false;
            return (
              <View key={cat.category} className="mb-4">
                <View className="flex-row items-center justify-between mb-1">
                  <View className="flex-row items-center space-x-2">
                    <Feather name={icon} size={14} color="#6B6560" />
                    <Text className="text-text-primary font-medium">{cat.category}</Text>
                    <Text className="text-text-secondary text-xs">({cat.count})</Text>
                  </View>
                  <View className="items-end">
                    <Text className={`font-bold text-sm ${overBudget ? 'text-overdue' : 'text-primary'}`}>
                      {baseCurrency} {Number(cat.monthly_total).toFixed(2)}/mo
                    </Text>
                    {cat.budget_limit && (
                      <Text className="text-text-secondary text-xs">
                        of {baseCurrency} {Number(cat.budget_limit).toFixed(0)} budget
                      </Text>
                    )}
                  </View>
                </View>
                {cat.budget_limit && (
                  <View className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <View
                      className="h-full rounded-full"
                      style={{
                        width: `${Math.min(usedPct, 100)}%`,
                        backgroundColor: overBudget ? '#EF4444' : usedPct > 75 ? '#F59E0B' : '#0D7377',
                      }}
                    />
                  </View>
                )}
              </View>
            );
          })}
        </View>
      )}

      {/* ── 6-Month Trends ───────────────────────────── */}
      {trends.length > 0 && (
        <View className="bg-card p-5 rounded-2xl border border-border mb-4">
          <Text className="text-text-secondary text-sm font-medium mb-4">📈 6-Month Trend</Text>
          {trends.map((t, i) => (
            <View key={i} className="flex-row items-center space-x-3 mb-3">
              <Text className="text-text-secondary text-xs w-16" numberOfLines={1}>
                {t.label || t.month}
              </Text>
              <View className="flex-1 h-6 bg-gray-100 rounded overflow-hidden justify-center">
                <View
                  className="h-full bg-primary rounded"
                  style={{ width: `${(t.total / maxTrend) * 100}%` }}
                />
              </View>
              <Text className="text-text-primary text-xs font-medium w-16 text-right">
                {baseCurrency} {Number(t.total).toFixed(0)}
              </Text>
            </View>
          ))}
        </View>
      )}

      {/* ── Nudges ───────────────────────────────────── */}
      {nudges.length > 0 && (
        <View className="bg-card p-5 rounded-2xl border border-border mb-4">
          <View className="flex-row items-center space-x-2 mb-3">
            <Feather name="alert-triangle" size={16} color="#F59E0B" />
            <Text className="text-text-secondary text-sm font-medium">Consider Cancelling</Text>
          </View>
          <Text className="text-text-secondary text-xs mb-3">
            These subscriptions have low worth-it ratings
          </Text>
          {nudges.map((nudge) => (
            <View key={nudge.id} className="flex-row justify-between items-center py-2 border-b border-border last:border-0">
              <View className="flex-1">
                <Text className="text-text-primary font-medium">{nudge.name}</Text>
                <View className="flex-row items-center space-x-1">
                  <Text className="text-yellow-400 text-xs">{'★'.repeat(nudge.worthItRating)}{'☆'.repeat(5 - nudge.worthItRating)}</Text>
                  <Text className="text-text-secondary text-xs">· {nudge.timesRenewed}x renewed</Text>
                </View>
              </View>
              <View className="items-end">
                <Text className="text-overdue font-bold text-sm">
                  {nudge.currency} {Number(nudge.monthlyCost).toFixed(2)}/mo
                </Text>
                <Text className="text-text-secondary text-xs">
                  {nudge.currency} {Number(nudge.totalSpent).toFixed(0)} spent total
                </Text>
              </View>
            </View>
          ))}
        </View>
      )}

      {!loading && breakdown.length === 0 && !health && (
        <View className="items-center justify-center mt-20">
          <Feather name="bar-chart-2" size={48} color="#9CA3AF" />
          <Text className="text-text-secondary mt-4">No analytics data yet</Text>
          <Text className="text-text-secondary text-xs mt-1">Add subscriptions to see insights</Text>
        </View>
      )}
    </ScrollView>
  );
}
