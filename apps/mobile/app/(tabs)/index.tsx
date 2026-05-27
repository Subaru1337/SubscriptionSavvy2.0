import {
  View, Text, ScrollView, RefreshControl,
  TouchableOpacity, ActivityIndicator
} from 'react-native';
import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'expo-router';
import { api } from '../../lib/api';
import { Feather } from '@expo/vector-icons';
import DonutChart from '../../components/DonutChart';

type Summary = {
  monthly_total: number;
  annual_total: number;
  active_subscriptions: number;
  budget_used_percent: number | null;
};

type Subscription = {
  id: string;
  name: string;
  cost: string | number;
  currency: string;
  category: string;
  nextPayment: string;
};

type CategoryBreakdown = {
  category: string;
  monthly_total: number;
};

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

// Fallback logic for remaining budget if budget is null
const DEFAULT_BUDGET = 2000;

export default function DashboardScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [breakdown, setBreakdown] = useState<CategoryBreakdown[]>([]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [sumRes, subsRes, bdRes] = await Promise.all([
        api.get('/analytics/summary'),
        api.get('/subscriptions'),
        api.get('/analytics/category-breakdown'),
      ]);
      setSummary(sumRes.data);
      setSubscriptions(
        Array.isArray(subsRes.data)
          ? subsRes.data
          : subsRes.data?.subscriptions ?? []
      );
      setBreakdown(bdRes.data?.breakdown ?? bdRes.data ?? []);
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

  const upcoming = subscriptions
    .filter(s => new Date(s.nextPayment) >= new Date(new Date().setHours(0,0,0,0)))
    .sort((a, b) => new Date(a.nextPayment).getTime() - new Date(b.nextPayment).getTime())
    .slice(0, 3);

  const budgetLimit = summary?.budget_used_percent
    ? (summary.monthly_total / summary.budget_used_percent) * 100
    : DEFAULT_BUDGET; // mock budget if not set
  
  const remaining = Math.max(0, budgetLimit - (summary?.monthly_total || 0));

  let statusBadge = { label: 'Great', color: 'bg-[#10B981]' };
  if (summary?.budget_used_percent && summary.budget_used_percent > 90) {
    statusBadge = { label: 'Warning', color: 'bg-[#EF4444]' };
  } else if (summary?.budget_used_percent && summary.budget_used_percent > 75) {
    statusBadge = { label: 'Careful', color: 'bg-[#F59E0B]' };
  }

  const chartData = breakdown.map(cat => ({
    label: cat.category,
    value: cat.monthly_total,
    color: CATEGORY_COLORS[cat.category] || '#9CA3AF',
  }));

  // Group smaller categories if there are too many (for the legend)
  const topCategories = breakdown.slice(0, 3);

  return (
    <View className="flex-1 bg-[#F9FAFB]">
      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchData} />}
      >
        {/* Header Section */}
        <View className="flex-row items-center justify-between mb-4 mt-2">
          <View>
            <Text className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">
              Budget Status
            </Text>
            <Text className="text-2xl font-bold text-gray-900">
              Monthly Overview
            </Text>
          </View>
          <View className={`${statusBadge.color} flex-row items-center px-3 py-1.5 rounded-full space-x-1`}>
            <Feather name="check-circle" size={14} color="white" />
            <Text className="text-white font-bold text-xs">{statusBadge.label}</Text>
          </View>
        </View>

        {/* Overview Cards */}
        <View className="flex-row space-x-4 mb-6">
          <View className="flex-1 bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
            <View className="w-10 h-10 rounded-xl bg-teal-50 items-center justify-center mb-4">
              <Feather name="calendar" size={20} color="#0D7377" />
            </View>
            <Text className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">
              Total Monthly
            </Text>
            <Text className="text-2xl font-bold text-[#0D7377]">
              ${summary?.monthly_total?.toFixed(2) || '0.00'}
            </Text>
          </View>
          <View className="flex-1 bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
            <View className="w-10 h-10 rounded-xl bg-green-50 items-center justify-center mb-4">
              <Feather name="dollar-sign" size={20} color="#10B981" />
            </View>
            <Text className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">
              Remaining
            </Text>
            <Text className="text-2xl font-bold text-[#10B981]">
              ${remaining.toFixed(2)}
            </Text>
          </View>
        </View>

        {/* Spending by Category Chart */}
        <View className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 mb-6">
          <View className="flex-row justify-between items-center mb-6">
            <Text className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
              Spending by Category
            </Text>
            <Feather name="more-horizontal" size={20} color="#9CA3AF" />
          </View>
          <View className="flex-row items-center justify-between">
            <DonutChart data={chartData} activeCount={summary?.active_subscriptions || 0} />
            <View className="flex-1 ml-6 space-y-4">
              {topCategories.map(cat => {
                const pct = summary?.monthly_total 
                  ? ((cat.monthly_total / summary.monthly_total) * 100).toFixed(0) 
                  : 0;
                return (
                  <View key={cat.category} className="flex-row items-center justify-between">
                    <View className="flex-row items-center">
                      <View 
                        className="w-2.5 h-2.5 rounded-full mr-2" 
                        style={{ backgroundColor: CATEGORY_COLORS[cat.category] || '#9CA3AF' }} 
                      />
                      <Text className="text-sm text-gray-600">{cat.category}</Text>
                    </View>
                    <Text className="text-sm font-bold text-gray-900">{pct}%</Text>
                  </View>
                );
              })}
            </View>
          </View>
        </View>

        {/* Upcoming Renewals */}
        <View className="flex-row items-center justify-between mb-4">
          <Text className="text-lg font-bold text-gray-900">
            Upcoming Renewals
          </Text>
          <TouchableOpacity onPress={() => router.push('/subscriptions')}>
            <Text className="text-xs font-bold text-[#0D7377] uppercase tracking-wider">
              View All
            </Text>
          </TouchableOpacity>
        </View>

        {upcoming.length > 0 ? upcoming.map(sub => {
          const daysAway = Math.ceil((new Date(sub.nextPayment).getTime() - new Date().getTime()) / (1000 * 3600 * 24));
          return (
            <TouchableOpacity
              key={sub.id}
              onPress={() => router.push(`/subscription/${sub.id}`)}
              className="bg-white p-4 rounded-2xl flex-row items-center shadow-sm border border-gray-100 mb-3"
            >
              <View className="w-12 h-12 rounded-xl bg-[#0D7377] items-center justify-center mr-4">
                <Text className="text-white font-bold text-xl uppercase">
                  {sub.name.charAt(0)}
                </Text>
              </View>
              <View className="flex-1">
                <Text className="text-base font-medium text-gray-900 mb-0.5">{sub.name}</Text>
                <Text className="text-xs text-gray-500">Due in {daysAway} days</Text>
              </View>
              <View className="items-end">
                <Text className="text-base font-bold text-[#0D7377] mb-1">
                  ${Number(sub.cost).toFixed(2)}
                </Text>
                <View className="bg-gray-100 px-2 py-0.5 rounded-md">
                  <Text className="text-[8px] font-bold text-gray-500 uppercase tracking-widest">
                    {sub.category}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          );
        }) : (
          <View className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 items-center justify-center">
             <Text className="text-gray-500 text-sm">No upcoming renewals this month</Text>
          </View>
        )}
      </ScrollView>

      {/* FAB */}
      <TouchableOpacity
        onPress={() => router.push('/add-subscription')}
        className="absolute bottom-6 right-6 w-14 h-14 bg-[#0D7377] rounded-full items-center justify-center shadow-lg elevation-5"
      >
        <Feather name="plus" size={24} color="white" />
      </TouchableOpacity>
    </View>
  );
}
