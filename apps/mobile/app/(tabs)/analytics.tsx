import {
  View, Text, ScrollView, RefreshControl,
  ActivityIndicator
} from 'react-native';
import { useState, useCallback, useEffect } from 'react';
import { api } from '../../lib/api';
import { Feather } from '@expo/vector-icons';
import DonutChart from '../../components/DonutChart';
import HealthArc from '../../components/HealthArc';
import AnimatedBar from '../../components/AnimatedBar';

const CATEGORY_COLORS: Record<string, string> = {
  Entertainment: '#E50914',
  Productivity: '#0061FF',
  Health: '#10B981',
  Education: '#F59E0B',
  Finance: '#0D9E75',
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
      <View className="flex-1 justify-center items-center bg-[#F4F6F9]">
        <ActivityIndicator size="large" color="#0D9E75" />
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
    <View className="flex-1 bg-[#F4F6F9]">
      <ScrollView
        contentContainerStyle={{ padding: 24, paddingBottom: 120 }}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchData} tintColor="#0D9E75" />}
        showsVerticalScrollIndicator={false}
      >
        <Text className="text-3xl font-bold text-[#111827] mb-8 mt-4" style={{ fontFamily: 'PlusJakartaSans_700Bold' }}>
          Insights
        </Text>

        {/* Subscription Health */}
        {healthScore && (
          <View className="bg-white p-6 rounded-[24px] shadow-sm border border-gray-100 mb-6 items-center">
            <View className="flex-row items-center mb-6 space-x-2">
              <Feather name="activity" size={16} color="#0D9E75" />
              <Text className="text-xs font-bold text-[#6B7280] uppercase tracking-widest" style={{ fontFamily: 'PlusJakartaSans_700Bold' }}>Subscription Health</Text>
            </View>
            
            <HealthArc score={healthScore.score} />
            
            <Text 
              className="text-lg font-bold mt-2 mb-4"
              style={{ color: healthScore.score >= 75 ? '#10B981' : healthScore.score >= 50 ? '#F59E0B' : '#EF4444', fontFamily: 'PlusJakartaSans_700Bold' }}
            >
              {healthScore.grade} Status
            </Text>
            
            <View className="w-full bg-[#F4F6F9] rounded-2xl p-4">
              {healthScore.score === 100 ? (
                <Text className="text-[13px] font-bold text-[#10B981] text-center" style={{ fontFamily: 'PlusJakartaSans_700Bold' }}>
                  Perfect score! Your subscriptions are optimized 🎉
                </Text>
              ) : (
                <View className="space-y-3">
                  {healthScore.deductions?.map((d: any, i: number) => (
                    <View key={i} className="flex-row items-start space-x-3">
                      <View className="bg-[#FEE2E2] px-2 py-0.5 rounded-md mt-0.5">
                        <Text className="text-[10px] font-bold text-[#EF4444]" style={{ fontFamily: 'PlusJakartaSans_700Bold' }}>{d.points}</Text>
                      </View>
                      <Text className="text-[13px] text-[#4B5563] flex-1 leading-5" style={{ fontFamily: 'PlusJakartaSans_500Medium' }}>{d.reason}</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          </View>
        )}

        {/* Annual Recap */}
        {annualRecap && (
          <View className="bg-[#0E0F14] p-6 rounded-[24px] shadow-lg mb-6">
            <View className="flex-row items-center space-x-2 mb-6">
              <Feather name="award" size={18} color="#1DCCA0" />
              <Text className="text-base font-bold text-white tracking-wide" style={{ fontFamily: 'PlusJakartaSans_700Bold' }}>{annualRecap.year} Spending Recap</Text>
            </View>
            {annualRecap.payment_count === 0 ? (
              <Text className="text-[13px] text-gray-400" style={{ fontFamily: 'PlusJakartaSans_500Medium' }}>Start marking payments as paid to build your annual recap</Text>
            ) : (
              <View>
                <View className="flex-row flex-wrap mb-2">
                  <View className="w-1/2 mb-6">
                    <Text className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1.5" style={{ fontFamily: 'PlusJakartaSans_700Bold' }}>Spent This Year</Text>
                    <Text className="text-2xl font-bold text-white" style={{ fontFamily: 'PlusJakartaSans_700Bold' }}>₹{annualRecap.year_total?.toFixed(0)}</Text>
                  </View>
                  <View className="w-1/2 mb-6 pl-4">
                    <Text className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1.5" style={{ fontFamily: 'PlusJakartaSans_700Bold' }}>Monthly Avg</Text>
                    <Text className="text-2xl font-bold text-white" style={{ fontFamily: 'PlusJakartaSans_700Bold' }}>₹{annualRecap.avg_monthly?.toFixed(0)}</Text>
                  </View>
                  <View className="w-1/2">
                    <Text className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1.5" style={{ fontFamily: 'PlusJakartaSans_700Bold' }}>Payments Made</Text>
                    <Text className="text-lg font-bold text-white" style={{ fontFamily: 'PlusJakartaSans_700Bold' }}>{annualRecap.payment_count}</Text>
                  </View>
                  <View className="w-1/2 pl-4">
                    <Text className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1.5" style={{ fontFamily: 'PlusJakartaSans_700Bold' }}>Top Category</Text>
                    <View className="bg-[#1DCCA0]/20 self-start px-2 py-1 rounded border border-[#1DCCA0]/30">
                      <Text className="text-[10px] font-bold text-[#1DCCA0] uppercase tracking-wider" style={{ fontFamily: 'PlusJakartaSans_700Bold' }}>{annualRecap.top_category}</Text>
                    </View>
                  </View>
                </View>
                {annualRecap.most_expensive_sub && (
                  <View className="mt-4 pt-4 border-t border-white/10 flex-row items-center justify-between">
                    <Text className="text-xs text-gray-400" style={{ fontFamily: 'PlusJakartaSans_500Medium' }}>Most Expensive:</Text>
                    <Text className="text-xs font-bold text-white" style={{ fontFamily: 'PlusJakartaSans_700Bold' }}>{annualRecap.most_expensive_sub.name} (₹{annualRecap.most_expensive_sub.total_paid})</Text>
                  </View>
                )}
              </View>
            )}
          </View>
        )}

        {/* Charts Row */}
        <View className="mb-6">
          <View className="bg-white p-6 rounded-[24px] shadow-sm border border-gray-100 mb-6">
            <Text className="text-sm font-bold text-[#111827] mb-6" style={{ fontFamily: 'PlusJakartaSans_700Bold' }}>Spending by Category</Text>
            {categories.length === 0 ? (
              <View className="h-32 items-center justify-center">
                <Text className="text-gray-400 text-xs">No data yet</Text>
              </View>
            ) : (
              <View className="flex-row items-center justify-between">
                <View className="flex-1 items-center justify-center">
                  <DonutChart data={chartData} activeCount={summary?.active_subscriptions || 0} />
                </View>
                <View className="flex-1 ml-6 space-y-4">
                  {categories.slice(0, 4).map((cat: any) => {
                    const pct = monthlyTotal ? ((cat.monthly_total / monthlyTotal) * 100).toFixed(0) : 0;
                    return (
                      <View key={cat.category} className="flex-row items-center justify-between">
                        <View className="flex-row items-center">
                          <View className="w-3 h-3 rounded-full mr-3" style={{ backgroundColor: CATEGORY_COLORS[cat.category] || '#9CA3AF' }} />
                          <Text className="text-[11px] font-bold text-[#4B5563] truncate w-16 uppercase tracking-wider" style={{ fontFamily: 'PlusJakartaSans_700Bold' }} numberOfLines={1}>{cat.category}</Text>
                        </View>
                        <Text className="text-[12px] font-bold text-[#111827]" style={{ fontFamily: 'PlusJakartaSans_700Bold' }}>{pct}%</Text>
                      </View>
                    );
                  })}
                </View>
              </View>
            )}
          </View>

          <View className="bg-white p-6 rounded-[24px] shadow-sm border border-gray-100">
            <Text className="text-sm font-bold text-[#111827] mb-6" style={{ fontFamily: 'PlusJakartaSans_700Bold' }}>6-Month Spending Trend</Text>
            {trends.length === 0 || trends.every(t => t.total === 0) ? (
              <View className="h-32 items-center justify-center">
                <Text className="text-gray-400 text-xs">No payment history yet</Text>
              </View>
            ) : (
              <View className="h-44 flex-row items-end justify-between">
                {trends.map((t, i) => (
                  <AnimatedBar
                    key={i}
                    value={t.total}
                    maxValue={maxTrend}
                    label={t.label.split(' ')[0].substring(0,3)}
                    delay={i * 100}
                    isCurrentMonth={i === trends.length - 1}
                  />
                ))}
              </View>
            )}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
