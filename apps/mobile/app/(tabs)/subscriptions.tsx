import {
  View, Text, ActivityIndicator, ScrollView, RefreshControl,
  TouchableOpacity, Alert, TextInput
} from 'react-native';
import { useState, useEffect, useCallback } from 'react';
import { api } from '../../lib/api';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Notifications from 'expo-notifications';

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

const CATEGORY_COLORS: Record<string, string> = {
  Entertainment: '#E50914', // Netflix red style
  Productivity: '#0061FF',
  Health: '#10B981',
  Education: '#F59E0B',
  Finance: '#0D7377',
  Shopping: '#EC4899',
  'Developer Tools': '#8B5CF6',
  Other: '#9CA3AF',
};

const FILTER_TABS = ['ALL', 'ENTERTAINMENT', 'PRODUCTIVITY', 'HEALTH', 'EDUCATION', 'FINANCE', 'SHOPPING'];

export default function SubscriptionsScreen() {
  const [loading, setLoading] = useState(true);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('ALL');
  const router = useRouter();

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
    return (
      <View className="flex-1 justify-center items-center bg-[#F9FAFB]">
        <ActivityIndicator size="large" color="#0D7377" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-[#F9FAFB]">
      {/* Search Bar */}
      <View className="px-4 pt-4 pb-2">
        <View className="flex-row items-center bg-white border border-gray-200 rounded-xl px-4 py-2.5 shadow-sm">
          <Feather name="search" size={20} color="#6B7280" />
          <TextInput
            className="flex-1 ml-3 text-base text-gray-900"
            placeholder="Search subscriptions..."
            placeholderTextColor="#9CA3AF"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      {/* Filter Pills */}
      <View className="pl-4 pb-4">
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {FILTER_TABS.map((tab) => {
            const isActive = activeFilter === tab;
            return (
              <TouchableOpacity
                key={tab}
                onPress={() => setActiveFilter(tab)}
                className={`px-4 py-2 rounded-lg mr-2 ${isActive ? 'bg-[#0D7377]' : 'bg-[#E5E7EB]'}`}
              >
                <Text className={`text-sm font-medium ${isActive ? 'text-white' : 'text-gray-700'}`}>
                  {tab}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      <ScrollView
        className="flex-1 px-4"
        refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchData} />}
      >
        {filteredSubscriptions.map((sub) => {
          const nextPaymentDate = new Date(sub.nextPayment);
          const isOverdue = nextPaymentDate < new Date(new Date().setHours(0,0,0,0));
          
          let statusBadge = { label: 'ACTIVE', color: 'bg-[#059669]', text: 'text-white' };
          if (isOverdue) statusBadge = { label: 'OVERDUE', color: 'bg-[#EF4444]', text: 'text-white' };
          if (sub.trialEndsOn && new Date(sub.trialEndsOn) >= new Date()) statusBadge = { label: 'TRIAL', color: 'bg-[#E0F2FE]', text: 'text-[#0284C7]' };
          if (sub.status === 'paused') statusBadge = { label: 'PAUSED', color: 'bg-[#F59E0B]', text: 'text-white' };
          if (sub.status === 'cancelled') statusBadge = { label: 'CANCELLED', color: 'bg-gray-200', text: 'text-gray-500' };

          const logoColor = CATEGORY_COLORS[sub.category] || '#0D7377';

          return (
            <TouchableOpacity
              key={sub.id}
              onPress={() => router.push(`/subscription/${sub.id}`)}
              className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex-row items-center mb-3"
            >
              {/* Logo Placeholder */}
              <View className="w-14 h-14 rounded-xl items-center justify-center mr-4" style={{ backgroundColor: logoColor }}>
                <Text className="text-white font-bold text-2xl uppercase">
                  {sub.name.charAt(0)}
                </Text>
              </View>

              {/* Info */}
              <View className="flex-1 justify-center">
                <Text className="text-base font-medium text-gray-900 mb-1" numberOfLines={1}>
                  {sub.name}
                </Text>
                <Text className="text-sm text-gray-500 capitalize">
                  {sub.category} • {sub.billingCycle}
                </Text>
              </View>

              {/* Status and Price */}
              <View className="items-end justify-between h-14">
                <View className={`${statusBadge.color} px-2 py-0.5 rounded-full`}>
                  <Text className={`${statusBadge.text} text-[9px] font-bold tracking-wider`}>
                    {statusBadge.label}
                  </Text>
                </View>
                <View className="items-end">
                  <Text className="text-base font-bold text-gray-900">
                    ₹{Number(sub.cost).toFixed(2)}
                  </Text>
                  <Text className={`text-[10px] font-bold uppercase mt-0.5 ${isOverdue ? 'text-red-500' : 'text-gray-500'}`}>
                    {isOverdue ? 'PAST DUE' : nextPaymentDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          );
        })}

        {filteredSubscriptions.length === 0 && !loading && (
          <View className="flex-1 items-center justify-center mt-20">
            <Feather name="search" size={48} color="#9CA3AF" />
            <Text className="text-center text-gray-500 mt-4 text-base">
              No subscriptions found.
            </Text>
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
