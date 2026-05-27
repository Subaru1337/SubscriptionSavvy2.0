import {
  View, Text, ScrollView, RefreshControl,
  ActivityIndicator
} from 'react-native';
import { useState, useCallback, useEffect } from 'react';
import { api } from '../../lib/api';
import { Feather } from '@expo/vector-icons';
import DonutChart from '../../components/DonutChart';

const CATEGORY_COLORS: Record<string, string> = {
  Entertainment: '#0D7377',
  Productivity: '#064E3B',
  Health: '#34D399',
  Education: '#60A5FA',
  Finance: '#F59E0B',
  Shopping: '#EC4899',
  'Developer Tools': '#8B5CF6',
  Other: '#9CA3AF',
};

export default function AnalyticsScreen() {
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<any>(null);
  const [categories, setCategories] = useState<any[]>([]);
  const [trends, setTrends] = useState<any[]>([]);
  const [healthScore, setHealthScore] = useState<any>(null);
  const [annualRecap, setAnnualRecap] = useState<any>(null);
  const [budgetPercent, setBudgetPercent] = useState<number>(0);
  const [monthlyTotal, setMonthlyTotal] = useState<number>(0);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [allRes, extRes] = await Promise.all([
        api.get('/analytics/all'),
        api.get('/analytics/extended'),
      ]);
      const allData = allRes.data || {};
      const extData = extRes.data || {};

      setSummary(allData.summary);
      setCategories(allData.breakdown || []);
      setTrends(allData.trends || []);
      setHealthScore(extData.healthScore);
      setAnnualRecap(extData.annualRecap);
      
      setMonthlyTotal(allData.summary?.monthly_total || 0);
      setBudgetPercent(allData.summary?.budget_used_percent || 0);

    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading && !summary) {
    return (
      <View className="flex-1 justify-center items-center bg-[#F9FAFB]">
        <ActivityIndicator size="large" color="#0D7377" />
      </View>
    );
  }

  const chartData = categories.map(cat => ({
    label: cat.category,
    value: cat.monthly_total,
    color: CATEGORY_COLORS[cat.category] || '#9CA3AF',
  }));

  const maxTrend = trends.length > 0 ? Math.max(...trends.map(t => t.total)) : 1;

  const getBudgetColor = (pct: number) => pct >= 90 ? '#EF4444' : pct >= 75 ? '#F59E0B' : '#10B981';

  return (
    <View className="flex-1 bg-[#F9FAFB]">
      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 60 }}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchData} />}
      >
        <Text className="text-2xl font-bold text-gray-900 mb-6 mt-2">
          Analytics
        </Text>

        {/* Subscription Health */}
        {healthScore && (
          <View className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 mb-6 flex-row items-center">
            <View className="items-center mr-6">
              <View className="flex-row items-center mb-2 space-x-1">
                <Feather name="heart" size={12} color="#0D7377" />
                <Text className="text-[10px] font-bold text-gray-900 uppercase">Health</Text>
              </View>
              <View 
                className="w-20 h-20 rounded-full border-[3px] items-center justify-center"
                style={{ borderColor: healthScore.score >= 75 ? '#10B981' : healthScore.score >= 50 ? '#F59E0B' : '#EF4444' }}
              >
                <Text className="text-2xl font-bold text-gray-900">{healthScore.score}</Text>
              </View>
              <Text 
                className="text-xs font-bold mt-2"
                style={{ color: healthScore.score >= 75 ? '#10B981' : healthScore.score >= 50 ? '#F59E0B' : '#EF4444' }}
              >
                {healthScore.grade}
              </Text>
            </View>
            <View className="flex-1 border-l border-gray-100 pl-4">
              {healthScore.score === 100 ? (
                <Text className="text-sm font-medium text-[#10B981]">
                  Perfect score! Your subscriptions are in great shape 🎉
                </Text>
              ) : (
                <View className="space-y-2">
                  {healthScore.deductions?.map((d: any, i: number) => (
                    <View key={i} className="flex-row items-start space-x-2">
                      <Text className="text-xs font-bold text-[#EF4444]">{d.points}</Text>
                      <Text className="text-xs text-gray-600 flex-1">{d.reason}</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          </View>
        )}

        {/* Annual Recap */}
        {annualRecap && (
          <View className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 mb-6">
            <View className="flex-row items-center space-x-2 mb-4">
              <Feather name="award" size={16} color="#0D7377" />
              <Text className="text-base font-bold text-gray-900">{annualRecap.year} Spending Recap</Text>
            </View>
            {annualRecap.payment_count === 0 ? (
              <Text className="text-sm text-gray-500">Start marking payments as paid to build your annual recap</Text>
            ) : (
              <View>
                <View className="flex-row flex-wrap mb-2">
                  <View className="w-1/2 mb-4">
                    <Text className="text-[10px] text-gray-500 font-bold uppercase mb-1">Spent This Year</Text>
                    <Text className="text-lg font-bold text-gray-900">${annualRecap.year_total?.toFixed(0)}</Text>
                  </View>
                  <View className="w-1/2 mb-4">
                    <Text className="text-[10px] text-gray-500 font-bold uppercase mb-1">Monthly Avg</Text>
                    <Text className="text-lg font-bold text-gray-900">${annualRecap.avg_monthly?.toFixed(0)}</Text>
                  </View>
                  <View className="w-1/2">
                    <Text className="text-[10px] text-gray-500 font-bold uppercase mb-1">Payments Made</Text>
                    <Text className="text-lg font-bold text-gray-900">{annualRecap.payment_count}</Text>
                  </View>
                  <View className="w-1/2">
                    <Text className="text-[10px] text-gray-500 font-bold uppercase mb-1">Top Category</Text>
                    <View className="bg-gray-100 self-start px-2 py-0.5 rounded">
                      <Text className="text-[10px] font-bold text-gray-700">{annualRecap.top_category}</Text>
                    </View>
                  </View>
                </View>
                {annualRecap.most_expensive_sub && (
                  <View className="mt-2 pt-3 border-t border-gray-100">
                    <Text className="text-xs text-gray-600">
                      Most expensive this year: <Text className="font-bold text-gray-900">{annualRecap.most_expensive_sub.name}</Text> at ${annualRecap.most_expensive_sub.total_paid}
                    </Text>
                  </View>
                )}
              </View>
            )}
          </View>
        )}

        {/* Budget Bar */}
        {budgetPercent > 0 && (
          <View className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 mb-6">
            <View className="flex-row justify-between items-center mb-3">
              <Text className="text-sm font-medium text-gray-900">
                ${monthlyTotal.toFixed(0)} monthly budget used
              </Text>
              <Text className="text-sm font-bold" style={{ color: getBudgetColor(budgetPercent) }}>
                {budgetPercent.toFixed(1)}%
              </Text>
            </View>
            <View className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
              <View 
                className="h-full rounded-full" 
                style={{ width: `${Math.min(budgetPercent, 100)}%`, backgroundColor: getBudgetColor(budgetPercent) }} 
              />
            </View>
          </View>
        )}

        {/* Charts Row */}
        <View className="mb-6">
          <View className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 mb-4">
            <Text className="text-sm font-bold text-gray-900 mb-6">Spending by Category</Text>
            {categories.length === 0 ? (
              <View className="h-32 items-center justify-center">
                <Text className="text-gray-400 text-xs">No data yet</Text>
              </View>
            ) : (
              <View className="flex-row items-center justify-between">
                <DonutChart data={chartData} activeCount={summary?.active_subscriptions || 0} />
                <View className="flex-1 ml-6 space-y-3">
                  {categories.slice(0, 4).map((cat: any) => {
                    const pct = monthlyTotal ? ((cat.monthly_total / monthlyTotal) * 100).toFixed(0) : 0;
                    return (
                      <View key={cat.category} className="flex-row items-center justify-between">
                        <View className="flex-row items-center">
                          <View className="w-2.5 h-2.5 rounded-full mr-2" style={{ backgroundColor: CATEGORY_COLORS[cat.category] || '#9CA3AF' }} />
                          <Text className="text-[10px] font-medium text-gray-600 truncate w-16" numberOfLines={1}>{cat.category}</Text>
                        </View>
                        <Text className="text-[10px] font-bold text-gray-900">{pct}%</Text>
                      </View>
                    );
                  })}
                </View>
              </View>
            )}
          </View>

          <View className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
            <Text className="text-sm font-bold text-gray-900 mb-6">6-Month Spending Trend</Text>
            {trends.length === 0 || trends.every(t => t.total === 0) ? (
              <View className="h-32 items-center justify-center">
                <Text className="text-gray-400 text-xs">No payment history yet</Text>
              </View>
            ) : (
              <View className="h-40 flex-row items-end justify-between pt-4">
                {trends.map((t, i) => {
                  const heightPct = maxTrend > 0 ? (t.total / maxTrend) * 100 : 0;
                  return (
                    <View key={i} className="items-center flex-1">
                      {t.total > 0 && (
                        <Text className="text-[8px] font-bold text-gray-500 mb-1">${t.total.toFixed(0)}</Text>
                      )}
                      <View 
                        className="w-full max-w-[24px] bg-[#0D7377] rounded-t-sm" 
                        style={{ height: `${Math.max(heightPct, 2)}%`, opacity: i === trends.length - 1 ? 1 : 0.5 }} 
                      />
                      <Text className="text-[9px] text-gray-500 mt-2">{t.label.split(' ')[0].substring(0,3)}</Text>
                    </View>
                  );
                })}
              </View>
            )}
          </View>
        </View>

        {/* Category Breakdown list */}
        <View className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
          <Text className="text-sm font-bold text-gray-900 mb-4">Category Breakdown</Text>
          {categories.length === 0 ? (
            <Text className="text-sm text-gray-500 text-center py-4">No categories tracked yet</Text>
          ) : (
            <View className="space-y-4">
              {categories.map((cat, i) => (
                <View key={cat.category} className={i !== categories.length - 1 ? "mb-4" : ""}>
                  <View className="flex-row items-center justify-between mb-2">
                    <View className="flex-row items-center">
                      <View className="w-2.5 h-2.5 rounded-full mr-2" style={{ backgroundColor: CATEGORY_COLORS[cat.category] || '#9CA3AF' }} />
                      <Text className="text-sm font-medium text-gray-900">{cat.category}</Text>
                    </View>
                    <Text className="text-sm font-bold text-gray-900">${cat.monthly_total.toFixed(0)}/mo</Text>
                  </View>
                  {cat.budget_limit && (
                    <View>
                      <View className="flex-row justify-between items-center text-xs mb-1">
                        <Text className="text-[10px] text-gray-500">${cat.monthly_total.toFixed(0)} of ${cat.budget_limit.toFixed(0)}</Text>
                        <Text className="text-[10px] font-bold" style={{ color: getBudgetColor(cat.budget_used_percent) }}>
                          {cat.budget_used_percent?.toFixed(0)}%
                        </Text>
                      </View>
                      <View className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <View 
                          className="h-full rounded-full" 
                          style={{ width: `${Math.min(cat.budget_used_percent || 0, 100)}%`, backgroundColor: getBudgetColor(cat.budget_used_percent) }} 
                        />
                      </View>
                    </View>
                  )}
                </View>
              ))}
            </View>
          )}
        </View>

      </ScrollView>
    </View>
  );
}
