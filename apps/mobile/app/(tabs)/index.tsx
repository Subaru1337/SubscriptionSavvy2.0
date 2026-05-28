import {
  View, Text, ScrollView, RefreshControl,
  TouchableOpacity, ActivityIndicator
} from 'react-native';
import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'expo-router';
import { api } from '../../lib/api';
import { Feather } from '@expo/vector-icons';

type Summary = {
  monthly_total: number;
  annual_total: number;
  active_subscriptions: number;
  budget_used_percent: number | null;
};

export default function DashboardScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [forecast, setForecast] = useState<any>(null);
  const [savings, setSavings] = useState<any>(null);
  const [subscriptions, setSubscriptions] = useState<any[]>([]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [allRes, subsRes, extRes] = await Promise.all([
        api.get('/analytics/all'),
        api.get('/subscriptions'),
        api.get('/analytics/extended'),
      ]);
      setSummary(allRes.data?.summary ?? null);
      setSubscriptions(
        Array.isArray(subsRes.data)
          ? subsRes.data
          : subsRes.data?.subscriptions ?? []
      );
      setForecast(extRes.data?.forecast ?? null);
      setSavings(extRes.data?.savings ?? null);
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

  // Reminders / Due This Week
  const today = new Date();
  const in7 = new Date(today);
  in7.setDate(in7.getDate() + 7);
  const dueSoon = subscriptions.filter(s => new Date(s.nextPayment) <= in7 && new Date(s.nextPayment) >= new Date(new Date().setHours(0,0,0,0)));

  return (
    <View className="flex-1 bg-[#F9FAFB]">
      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchData} />}
      >
        {/* Header Section */}
        <View className="mb-4 mt-2">
          <Text className="text-2xl font-bold text-gray-900">
            Dashboard
          </Text>
        </View>

        {/* Overview Cards (Stack instead of grid for mobile) */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-6 -mx-4 px-4 pb-2">
          <View className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 mr-4 w-40">
            <Text className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">
              Monthly Spend
            </Text>
            <Text className="text-2xl font-bold text-[#0D7377]">
              ₹{summary?.monthly_total?.toFixed(0) || '0'}
            </Text>
            <Text className="text-[10px] text-gray-400 mt-1">per month</Text>
          </View>

          <View className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 mr-4 w-40">
            <Text className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">
              Annual Projection
            </Text>
            <Text className="text-2xl font-bold text-gray-900">
              ₹{summary?.annual_total?.toFixed(0) || '0'}
            </Text>
            <Text className="text-[10px] text-gray-400 mt-1">per year</Text>
          </View>

          <View className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 mr-4 w-40">
            <Text className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">
              Active Subs
            </Text>
            <Text className="text-2xl font-bold text-gray-900">
              {summary?.active_subscriptions || 0}
            </Text>
            <Text className="text-[10px] text-gray-400 mt-1">services tracked</Text>
          </View>
        </ScrollView>

        {/* Short term outlook */}
        <View className="flex-row space-x-4 mb-6">
          {forecast && (
            <View className="flex-1 bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
              <View className="flex-row items-center mb-2">
                <Feather name="trending-up" size={14} color="#0D7377" />
                <Text className="text-[10px] font-bold text-gray-900 ml-1">Next 30 Days</Text>
              </View>
              <Text className="text-2xl font-bold text-gray-900">₹{forecast.next_month_total?.toFixed(0) || 0}</Text>
              <Text className="text-[9px] text-gray-500 mt-1 leading-3">
                across {forecast.billing_count} upcoming payments
              </Text>
              {forecast.largest_upcoming && (
                <View className="mt-3 pt-2 border-t border-gray-100">
                  <Text className="text-[9px] text-gray-500">
                    Largest: {forecast.largest_upcoming.name} — ₹{forecast.largest_upcoming.amount}
                  </Text>
                </View>
              )}
            </View>
          )}

          {savings && (
            <View className="flex-1 bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
              <View className="flex-row items-center mb-2">
                <Feather name="heart" size={14} color="#10B981" />
                <Text className="text-[10px] font-bold text-gray-900 ml-1">Saved by Cancelling</Text>
              </View>
              <Text className="text-2xl font-bold text-[#10B981]">₹{savings.total_saved?.toFixed(0) || 0}</Text>
              <Text className="text-[9px] text-gray-500 mt-1 leading-3">
                from {savings.cancelled_count} cancelled
              </Text>
              <View className="mt-3 pt-2 border-t border-gray-100">
                <Text className="text-[9px] text-gray-500">
                  Cancel unused subs to track savings
                </Text>
              </View>
            </View>
          )}
        </View>

        {/* Reminders / Due This Week */}
        <View className="mb-6">
          <Text className="text-lg font-bold text-gray-900 mb-3">
            Reminders
          </Text>
          <View className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <View className="bg-teal-50 px-4 py-2 flex-row items-center border-b border-gray-100">
              <Feather name="calendar" size={14} color="#0D7377" />
              <Text className="text-xs font-bold text-[#0D7377] ml-2">Due This Week</Text>
              <View className="bg-white px-2 py-0.5 rounded-full ml-2">
                <Text className="text-[10px] font-bold text-[#0D7377]">{dueSoon.length}</Text>
              </View>
            </View>
            {dueSoon.length > 0 ? dueSoon.map((sub, i) => (
              <TouchableOpacity
                key={sub.id}
                onPress={() => router.push(`/subscription/${sub.id}`)}
                className={`p-4 flex-row items-center justify-between ${i !== dueSoon.length - 1 ? 'border-b border-gray-100' : ''}`}
              >
                <View>
                  <Text className="text-sm font-medium text-gray-900 mb-1">{sub.name}</Text>
                  <Text className="text-xs text-gray-500">
                    Due: {new Date(sub.nextPayment).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </Text>
                </View>
                <View className="items-end">
                  <Text className="text-base font-bold text-gray-900 mb-1">
                    ₹{Number(sub.cost).toFixed(0)}
                  </Text>
                  <Text className="text-[10px] text-gray-400">Due This Week</Text>
                </View>
              </TouchableOpacity>
            )) : (
              <View className="p-6 items-center justify-center">
                <Text className="text-gray-500 text-sm">No payments due this week 🎉</Text>
              </View>
            )}
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
                  ₹{Number(sub.cost).toFixed(2)}
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
