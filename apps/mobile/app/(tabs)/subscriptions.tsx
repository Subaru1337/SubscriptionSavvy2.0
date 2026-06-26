import {
  View, Text, ScrollView, RefreshControl,
  TouchableOpacity, TextInput, StyleSheet, Animated
} from 'react-native';
import { useState, useEffect, useCallback, useRef } from 'react';
import { api } from '../../lib/api';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import SubscriptionLogo from '../../components/SubscriptionLogo';
import { getCurrencySymbol } from '../../lib/currency';
import { useBaseCurrency } from '../../lib/useBaseCurrency';

type Subscription = {
  id: string;
  name: string;
  cost: string | number;
  currency: string;
  billingCycle: string;
  nextPayment: string;
  status: string;
  category: string;
  notes?: string | null;
  worthItRating?: number | null;
  trialEndsOn?: string | null;
};

const FILTER_TABS = ['ALL', 'ENTERTAINMENT', 'PRODUCTIVITY', 'HEALTH', 'EDUCATION', 'FINANCE', 'SHOPPING'];

const SubscriptionsSkeleton = () => {
  const shimmer = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, { toValue: 0.7, duration: 800, useNativeDriver: true }),
        Animated.timing(shimmer, { toValue: 0.3, duration: 800, useNativeDriver: true })
      ])
    ).start();
  }, [shimmer]);

  return (
    <View className="flex-1 bg-[#F4F6F9] px-5 pt-8">
      <Animated.View style={{ opacity: shimmer }} className="w-full h-12 bg-[#E5E7EB] rounded-xl mb-6" />
      <View className="flex-row mb-6">
        {[1, 2, 3].map((i) => (
          <Animated.View key={i} style={{ opacity: shimmer }} className="w-20 h-8 bg-[#E5E7EB] rounded-full mr-2" />
        ))}
      </View>
      {[1, 2, 3, 4, 5].map((i) => (
        <Animated.View key={i} style={{ opacity: shimmer }} className="w-full h-20 bg-[#E5E7EB] rounded-2xl mb-3" />
      ))}
    </View>
  );
};

export default function SubscriptionsScreen() {
  const [loading, setLoading] = useState(true);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('ALL');
  const router = useRouter();
  const baseCurrency = useBaseCurrency();

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get('/subscriptions?status=all');
      let subs: Subscription[] = Array.isArray(response.data)
        ? response.data
        : response.data?.subscriptions ?? [];
      setSubscriptions(subs);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filteredSubscriptions = subscriptions.filter(sub => {
    const matchesSearch = sub.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = activeFilter === 'ALL' || sub.category.toUpperCase() === activeFilter;
    return matchesSearch && matchesFilter;
  });

  if (loading && subscriptions.length === 0) {
    return <SubscriptionsSkeleton />;
  }

  return (
    <View className="flex-1 bg-[#F4F6F9]">
      {/* Search Bar */}
      <View className="px-6 pt-4 pb-2">
        <View className="flex-row items-center bg-white rounded-[16px] px-4 py-3 shadow-sm border border-gray-100">
          <Feather name="search" size={20} color="#9CA3AF" />
          <TextInput
            className="flex-1 ml-3 text-[15px] text-[#111827]"
            style={{ fontFamily: 'PlusJakartaSans_500Medium' }}
            placeholder="Search subscriptions..."
            placeholderTextColor="#9CA3AF"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      {/* Filter Pills */}
      <View className="pb-4">
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 24 }}>
          {FILTER_TABS.map((tab) => {
            const isActive = activeFilter === tab;
            return (
              <TouchableOpacity
                key={tab}
                onPress={() => setActiveFilter(tab)}
                className={`px-5 py-2.5 rounded-full mr-2 shadow-sm ${isActive ? 'bg-[#0D9E75]' : 'bg-white'}`}
                style={isActive ? { shadowColor: '#0D9E75', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 5 } : {}}
              >
                <Text className={`text-xs uppercase tracking-widest ${isActive ? 'text-white' : 'text-[#6B7280]'}`} style={{ fontFamily: 'PlusJakartaSans_700Bold' }}>
                  {tab}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 120, flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchData} tintColor="#0D9E75" />}
      >
        {filteredSubscriptions.map((sub) => {
          const nextPaymentDate = new Date(sub.nextPayment);
          const isOverdue = nextPaymentDate < new Date(new Date().setHours(0,0,0,0));
          
          let statusBadge = { label: 'ACTIVE', color: 'bg-[#D1FAE5]', text: 'text-[#047857]' };
          if (isOverdue) statusBadge = { label: 'OVERDUE', color: 'bg-[#FEE2E2]', text: 'text-[#B91C1C]' };
          if (sub.trialEndsOn && new Date(sub.trialEndsOn) >= new Date()) statusBadge = { label: 'TRIAL', color: 'bg-[#E0F2FE]', text: 'text-[#0369A1]' };
          if (sub.status === 'paused') statusBadge = { label: 'PAUSED', color: 'bg-[#FEF3C7]', text: 'text-[#B45309]' };
          if (sub.status === 'cancelled') statusBadge = { label: 'CANCELLED', color: 'bg-[#F3F4F6]', text: 'text-[#6B7280]' };

          return (
            <TouchableOpacity
              key={sub.id}
              onPress={() => router.push(`/subscription/${sub.id}`)}
              className="bg-white rounded-[24px] p-5 shadow-sm border border-gray-100 mb-4"
              style={{ width: '48%' }}
            >
              <View className="flex-row justify-between items-start mb-5">
                <SubscriptionLogo name={sub.name} size={44} />
                <View className={`${statusBadge.color} px-2 py-1 rounded-[6px]`}>
                  <Text className={`${statusBadge.text} text-[8px] tracking-widest uppercase`} style={{ fontFamily: 'PlusJakartaSans_700Bold' }}>
                    {statusBadge.label}
                  </Text>
                </View>
              </View>

              <Text className="text-[15px] text-[#111827] mb-1.5" style={{ fontFamily: 'PlusJakartaSans_700Bold' }} numberOfLines={1}>
                {sub.name}
              </Text>
              <Text className="text-[9px] text-[#9CA3AF] uppercase tracking-widest mb-4" style={{ fontFamily: 'PlusJakartaSans_700Bold' }}>
                {sub.category}
              </Text>

              <View className="pt-3 border-t border-gray-100 flex-row justify-between items-end">
                <View>
                  <Text className="text-base text-[#0D9E75]" style={{ fontFamily: 'PlusJakartaSans_700Bold' }}>
                    {getCurrencySymbol(sub.currency)}{Number(sub.cost).toFixed(0)}
                  </Text>
                  {sub.currency !== baseCurrency ? (
                    <View style={{ backgroundColor: '#E0F2FE', paddingHorizontal: 5, paddingVertical: 1, borderRadius: 4, alignSelf: 'flex-start', marginTop: 2 }}>
                      <Text style={{ fontSize: 9, fontFamily: 'PlusJakartaSans_700Bold', color: '#0369A1' }}>{sub.currency}</Text>
                    </View>
                  ) : null}
                </View>
                <Text className={`text-[10px] mt-1 ${isOverdue ? 'text-[#EF4444]' : 'text-[#6B7280]'}`} style={{ fontFamily: 'PlusJakartaSans_500Medium' }}>
                  {isOverdue ? 'Past Due' : `Due ${nextPaymentDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}

        {filteredSubscriptions.length === 0 && !loading && (
          <View className="flex-1 items-center justify-center mt-20 w-full">
            <Feather name="search" size={48} color="#D1D5DB" />
            <Text className="text-center text-[#6B7280] mt-4 text-[15px]" style={{ fontFamily: 'PlusJakartaSans_500Medium' }}>
              No subscriptions found.
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}
