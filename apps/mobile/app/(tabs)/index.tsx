import {
  View, Text, ScrollView, RefreshControl,
  TouchableOpacity, ActivityIndicator, Alert
} from 'react-native';
import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'expo-router';
import { api } from '../../lib/api';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Rect, Path } from 'react-native-svg';
import AnimatedNumber from '../../components/AnimatedNumber';
import AnimatedRing from '../../components/AnimatedRing';
import SubscriptionLogo from '../../components/SubscriptionLogo';

// Empty State SVG
const CalendarEmptyState = () => (
  <View className="items-center py-8">
    <Svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#0D9E75" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <Rect x="3" y="4" width="18" height="18" rx="2" ry="2"></Rect>
      <Path d="M16 2v4"></Path>
      <Path d="M8 2v4"></Path>
      <Path d="M3 10h18"></Path>
      <Path d="M9 16l2 2 4-4"></Path>
    </Svg>
    <Text className="text-[#6B7280] text-sm mt-4" style={{ fontFamily: 'PlusJakartaSans_500Medium' }}>No payments due this week 🎉</Text>
  </View>
);

type Summary = {
  monthly_total: number;
  annual_total: number;
  active_subscriptions: number;
  budget_used_percent: number | null;
};

export default function DashboardScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState<string | null>(null);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [forecast, setForecast] = useState<any>(null);
  const [savings, setSavings] = useState<any>(null);
  const [categories, setCategories] = useState<any[]>([]);
  const [subscriptions, setSubscriptions] = useState<any[]>([]);

  const handleMarkAsPaid = async (id: string) => {
    setPaying(id);
    try {
      await api.post(`/subscriptions/${id}/pay`);
      fetchData();
    } catch (err: any) {
      const msg = err.response?.data?.error || 'Failed to mark as paid';
      Alert.alert('Error', msg);
    } finally {
      setPaying(null);
    }
  };

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
      setCategories(allRes.data?.breakdown ?? []);
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
      <View className="flex-1 justify-center items-center bg-[#F4F6F9]">
        <ActivityIndicator size="large" color="#0D9E75" />
      </View>
    );
  }

  const upcoming = subscriptions
    .filter(s => new Date(s.nextPayment) >= new Date(new Date().setHours(0,0,0,0)))
    .sort((a, b) => new Date(a.nextPayment).getTime() - new Date(b.nextPayment).getTime())
    .slice(0, 3);

  // Horizontal Timeline: Next 30 days
  const today = new Date();
  const in30 = new Date(today);
  in30.setDate(in30.getDate() + 30);
  const next30DaysSubs = subscriptions
    .filter(s => s.status === 'active' && new Date(s.nextPayment) <= in30 && new Date(s.nextPayment) >= new Date(new Date().setHours(0,0,0,0)))
    .sort((a, b) => new Date(a.nextPayment).getTime() - new Date(b.nextPayment).getTime());

  // Reminders / Due This Week
  const in7 = new Date(today);
  in7.setDate(in7.getDate() + 7);
  const dueSoon = subscriptions.filter(s => s.status === 'active' && new Date(s.nextPayment) <= in7 && new Date(s.nextPayment) >= new Date(new Date().setHours(0,0,0,0)));
  
  // Overdue
  const overdue = subscriptions.filter(s => s.status === 'active' && new Date(s.nextPayment) < new Date(new Date().setHours(0,0,0,0)))
    .sort((a, b) => new Date(a.nextPayment).getTime() - new Date(b.nextPayment).getTime());

  const budgetUsed = summary?.budget_used_percent || 0;

  return (
    <View className="flex-1 bg-[#F4F6F9]">
      <ScrollView
        contentContainerStyle={{ padding: 20, paddingBottom: 120 }}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchData} tintColor="#0D9E75" />}
      >
        {/* Animated Hero Card */}
        <LinearGradient
          colors={['#0E1B2E', '#0D3B2F']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ borderRadius: 24, padding: 24, marginBottom: 32, shadowColor: '#0E1B2E', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.2, shadowRadius: 20, elevation: 10 }}
        >
          <View className="flex-row justify-between items-center mb-6">
            <View>
              <Text className="text-gray-300 text-[10px] uppercase tracking-widest mb-1" style={{ fontFamily: 'PlusJakartaSans_700Bold' }}>
                Monthly Spend
              </Text>
              <AnimatedNumber 
                value={summary?.monthly_total || 0} 
                prefix="₹" 
                className="text-[40px] text-white" 
                style={{ fontFamily: 'PlusJakartaSans_700Bold', lineHeight: 48 }} 
              />
              <Text className="text-[#1DCCA0] text-xs mt-1" style={{ fontFamily: 'PlusJakartaSans_500Medium' }}>
                this month · {summary?.active_subscriptions || 0} active subs
              </Text>
            </View>
            <View className="items-center justify-center relative">
              <AnimatedRing percentage={budgetUsed} size={72} strokeWidth={6} color="#1DCCA0" trackColor="rgba(255,255,255,0.15)" />
              <View className="absolute items-center justify-center">
                <Text className="text-[#1DCCA0] text-sm" style={{ fontFamily: 'PlusJakartaSans_700Bold' }}>
                  {Math.round(budgetUsed)}%
                </Text>
              </View>
            </View>
          </View>
          <View className="flex-row justify-between pt-4 border-t border-white/10">
            <Text className="text-gray-300 text-xs" style={{ fontFamily: 'PlusJakartaSans_500Medium' }}>
              Annual: ₹{(summary?.annual_total || 0).toLocaleString()}
            </Text>
            <Text className="text-[#1DCCA0] text-xs" style={{ fontFamily: 'PlusJakartaSans_700Bold' }}>
              vs last month: ↑ 0%
            </Text>
          </View>
          <View className="flex-row justify-between pt-4 mt-4 border-t border-white/10">
            <View className="flex-row items-center">
              <Feather name="shield" size={14} color="#1DCCA0" />
              <Text className="text-gray-300 text-xs ml-1.5" style={{ fontFamily: 'PlusJakartaSans_500Medium' }}>
                Saved by Cancelling
              </Text>
            </View>
            <Text className="text-[#1DCCA0] text-xs" style={{ fontFamily: 'PlusJakartaSans_700Bold' }}>
              ₹{Math.round(savings?.total_saved || 0).toLocaleString()}
            </Text>
          </View>
        </LinearGradient>



        {/* Horizontal Renewal Timeline */}
        <View className="mb-8 -mx-5 px-5">
          <Text className="text-[15px] text-[#111827] mb-4" style={{ fontFamily: 'PlusJakartaSans_700Bold' }}>
            Next 30 Days
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingRight: 20 }}>
            {next30DaysSubs.length > 0 ? next30DaysSubs.map((sub, i) => {
              const isDueSoon = new Date(sub.nextPayment) <= in7;
              const dateObj = new Date(sub.nextPayment);
              return (
                <TouchableOpacity 
                  key={`${sub.id}-${i}`}
                  onPress={() => router.push(`/subscription/${sub.id}`)}
                  className={`bg-white rounded-[20px] p-4 mr-3 shadow-sm border border-[#0D9E75] items-center w-[84px]`}
                >
                  <Text className="text-[10px] text-[#6B7280] mb-3 uppercase tracking-widest" style={{ fontFamily: 'PlusJakartaSans_700Bold' }}>
                    {dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </Text>
                  <SubscriptionLogo name={sub.name} size={42} />
                  <Text className="text-xs text-[#111827] mt-3" style={{ fontFamily: 'PlusJakartaSans_700Bold' }}>
                    ₹{Number(sub.cost).toFixed(0)}
                  </Text>
                </TouchableOpacity>
              );
            }) : (
              <View className="bg-white rounded-[20px] p-6 shadow-sm border border-transparent">
                <Text className="text-sm text-[#6B7280]" style={{ fontFamily: 'PlusJakartaSans_500Medium' }}>No renewals coming up soon!</Text>
              </View>
            )}
          </ScrollView>
        </View>

        {/* Reminders / Due This Week */}
        <View className="mb-8">
          <Text className="text-[15px] text-[#111827] mb-4" style={{ fontFamily: 'PlusJakartaSans_700Bold' }}>
            Reminders
          </Text>
          <View className="bg-white rounded-2xl shadow-sm overflow-hidden">
            {dueSoon.length > 0 ? dueSoon.map((sub, i) => {
              const todayMidnight = new Date(new Date().setHours(0,0,0,0));
              const payDate = new Date(sub.nextPayment);
              payDate.setHours(0,0,0,0);
              const daysAway = Math.round((payDate.getTime() - todayMidnight.getTime()) / (1000 * 3600 * 24));
              
              let dotColor = '#10B981'; // Green
              if (daysAway <= 1) dotColor = '#EF4444'; // Red for today/tomorrow
              else if (daysAway <= 7) dotColor = '#F59E0B'; // Orange for this week

              return (
              <TouchableOpacity
                key={sub.id}
                onPress={() => router.push(`/subscription/${sub.id}`)}
                className={`p-4 flex-row items-center justify-between ${i !== dueSoon.length - 1 ? 'border-b border-[#F4F6F9]' : ''}`}
              >
                <View className="flex-row items-center">
                  <View className="relative">
                    <SubscriptionLogo name={sub.name} size={40} />
                    <View className="absolute -top-1 -right-1 w-3 h-3 rounded-full border-2 border-white" style={{ backgroundColor: dotColor }} />
                  </View>
                  <View className="ml-4">
                    <Text className="text-sm text-[#111827] mb-0.5" style={{ fontFamily: 'PlusJakartaSans_700Bold' }}>{sub.name}</Text>
                    <Text className="text-xs text-[#F59E0B]" style={{ fontFamily: 'PlusJakartaSans_500Medium' }}>
                      Due: {new Date(sub.nextPayment).toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}
                    </Text>
                  </View>
                </View>
                <View className="items-end">
                  <Text className="text-sm text-[#111827]" style={{ fontFamily: 'PlusJakartaSans_700Bold' }}>
                    ₹{Number(sub.cost).toFixed(0)}
                  </Text>
                </View>
              </TouchableOpacity>
            )}) : (
              <CalendarEmptyState />
            )}
          </View>
        </View>

        {/* Overdue */}
        {overdue.length > 0 && (
          <View className="mb-8">
            <View className="bg-white rounded-2xl shadow-sm border border-[#FEE2E2] overflow-hidden">
              <View className="bg-[#FEF2F2] px-4 py-3 flex-row items-center border-b border-[#FEE2E2]">
                <Feather name="alert-circle" size={14} color="#EF4444" />
                <Text className="text-[11px] text-[#EF4444] ml-2 uppercase tracking-widest" style={{ fontFamily: 'PlusJakartaSans_700Bold' }}>Action Required</Text>
              </View>
              {overdue.map((sub, i) => (
                <TouchableOpacity
                  key={sub.id}
                  onPress={() => router.push(`/subscription/${sub.id}`)}
                  className={`p-4 flex-row items-center border-l-4 border-l-[#EF4444] justify-between ${i !== overdue.length - 1 ? 'border-b border-[#F4F6F9]' : ''}`}
                >
                  <View className="flex-row items-center flex-1">
                    <SubscriptionLogo name={sub.name} size={40} />
                    <View className="ml-4 flex-1">
                      <Text className="text-sm text-[#111827] mb-0.5" style={{ fontFamily: 'PlusJakartaSans_700Bold' }} numberOfLines={1}>{sub.name}</Text>
                      <Text className="text-[11px] text-[#EF4444]" style={{ fontFamily: 'PlusJakartaSans_500Medium' }}>
                        Overdue: {new Date(sub.nextPayment).toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}
                      </Text>
                    </View>
                  </View>
                  <TouchableOpacity 
                    onPress={() => handleMarkAsPaid(sub.id)}
                    disabled={paying === sub.id}
                    className="bg-[#10B981] w-10 h-10 rounded-full items-center justify-center shadow-sm ml-3"
                  >
                    {paying === sub.id ? (
                      <ActivityIndicator size="small" color="white" />
                    ) : (
                      <Feather name="check" size={18} color="white" />
                    )}
                  </TouchableOpacity>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Upcoming Renewals List */}
        <View className="flex-row items-center justify-between mb-4">
          <Text className="text-[15px] text-[#111827]" style={{ fontFamily: 'PlusJakartaSans_700Bold' }}>
            Upcoming
          </Text>
          <TouchableOpacity onPress={() => router.push('/subscriptions')}>
            <Text className="text-xs text-[#0D9E75] uppercase tracking-widest" style={{ fontFamily: 'PlusJakartaSans_700Bold' }}>
              View All
            </Text>
          </TouchableOpacity>
        </View>

        {upcoming.length > 0 ? upcoming.map(sub => {
          const todayMidnight = new Date(new Date().setHours(0,0,0,0));
          const payDate = new Date(sub.nextPayment);
          payDate.setHours(0,0,0,0);
          const daysAway = Math.round((payDate.getTime() - todayMidnight.getTime()) / (1000 * 3600 * 24));
          
          let badgeColor = 'bg-[#D1FAE5] text-[#047857]'; // Teal/Emerald
          if (daysAway <= 3) badgeColor = 'bg-[#FEE2E2] text-[#B91C1C]'; // Red
          else if (daysAway <= 7) badgeColor = 'bg-[#FEF3C7] text-[#B45309]'; // Amber

          return (
            <TouchableOpacity
              key={sub.id}
              onPress={() => router.push(`/subscription/${sub.id}`)}
              className="bg-white p-4 rounded-2xl flex-row items-center shadow-sm mb-3"
            >
              <SubscriptionLogo name={sub.name} size={48} />
              <View className="flex-1 ml-4">
                <Text className="text-[15px] text-[#111827] mb-1.5" style={{ fontFamily: 'PlusJakartaSans_700Bold' }}>{sub.name}</Text>
                <View className={`self-start px-2 py-1 rounded-[6px] ${badgeColor.split(' ')[0]}`}>
                  <Text className={`text-[9px] uppercase tracking-widest ${badgeColor.split(' ')[1]}`} style={{ fontFamily: 'PlusJakartaSans_700Bold' }}>
                    {daysAway === 0 ? 'Due Today' : `Due in ${daysAway} days`}
                  </Text>
                </View>
              </View>
              <View className="items-end">
                <Text className="text-[15px] text-[#111827] mb-1" style={{ fontFamily: 'PlusJakartaSans_700Bold' }}>
                  ₹{Number(sub.cost).toFixed(0)}
                </Text>
                <Text className="text-[10px] text-[#9CA3AF] uppercase tracking-wider" style={{ fontFamily: 'PlusJakartaSans_600SemiBold' }}>
                  {new Date(sub.nextPayment).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </Text>
              </View>
            </TouchableOpacity>
          );
        }) : null}

      </ScrollView>
    </View>
  );
}
