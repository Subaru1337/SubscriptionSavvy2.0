import {
  View, Text, ScrollView, RefreshControl,
  TouchableOpacity, ActivityIndicator, Animated
} from 'react-native';
import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { api } from '../../lib/api';
import { Feather } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
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
  category: string;
};

const CATEGORY_COLORS: Record<string, string> = {
  Entertainment: '#E50914',
  Productivity: '#0061FF',
  Health: '#10B981',
  Education: '#F59E0B',
  Finance: '#0D7377',
  Shopping: '#EC4899',
  'Developer Tools': '#8B5CF6',
  Other: '#9CA3AF',
};

// Helper functions for calendar
const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
const getFirstDayOfMonth = (year: number, month: number) => {
  let day = new Date(year, month, 1).getDay();
  return day === 0 ? 6 : day - 1; // Convert to Mon=0, Sun=6
};

const MONTH_NAMES = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const CalendarSkeleton = () => {
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
      {/* Calendar Header */}
      <Animated.View style={{ opacity: shimmer }} className="w-48 h-6 bg-[#E5E7EB] rounded-lg mb-6" />
      
      {/* Calendar Grid Skeleton */}
      <Animated.View style={{ opacity: shimmer }} className="w-full h-64 bg-[#E5E7EB] rounded-3xl mb-8" />

      {/* List items skeleton */}
      <Animated.View style={{ opacity: shimmer }} className="w-32 h-5 bg-[#E5E7EB] rounded-lg mb-4" />
      {[1, 2, 3].map((i) => (
        <Animated.View key={i} style={{ opacity: shimmer }} className="w-full h-16 bg-[#E5E7EB] rounded-2xl mb-3" />
      ))}
    </View>
  );
};

export default function CalendarScreen() {
  const [loading, setLoading] = useState(true);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const router = useRouter();
  const baseCurrency = useBaseCurrency();

  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get('/subscriptions?status=active');
      setSubscriptions(
        Array.isArray(response.data) ? response.data : response.data?.subscriptions ?? []
      );
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [fetchData])
  );

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const handlePrevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const handleNextMonth = () => setCurrentDate(new Date(year, month + 1, 1));
  const handleToday = () => {
    const today = new Date();
    setCurrentDate(today);
    setSelectedDate(today);
  };

  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);

  // Group subscriptions by date string YYYY-MM-DD
  const subsByDate = useMemo(() => {
    const grouped: Record<string, Subscription[]> = {};
    subscriptions.forEach(sub => {
      const dateStr = sub.nextPayment.split('T')[0];
      if (!grouped[dateStr]) grouped[dateStr] = [];
      grouped[dateStr].push(sub);
    });
    return grouped;
  }, [subscriptions]);

  const renewalsThisMonth = useMemo(() => {
    return subscriptions.filter(sub => {
      const d = new Date(sub.nextPayment);
      return d.getFullYear() === year && d.getMonth() === month;
    }).length;
  }, [subscriptions, year, month]);

  const selectedDateStr = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}`;
  const selectedSubs = subsByDate[selectedDateStr] || [];
  const selectedTotal = selectedSubs.reduce((sum, sub) => sum + Number(sub.cost), 0);

  // Generate grid cells
  const gridCells = [];
  for (let i = 0; i < firstDay; i++) {
    gridCells.push(null);
  }
  for (let i = 1; i <= daysInMonth; i++) {
    gridCells.push(i);
  }
  // Fill remaining to complete the last row
  while (gridCells.length % 7 !== 0) {
    gridCells.push(null);
  }

  if (loading && subscriptions.length === 0) {
    return <CalendarSkeleton />;
  }

  return (
    <View className="flex-1 bg-[#F4F6F9]">
      <ScrollView
        contentContainerStyle={{ padding: 24, paddingBottom: 120 }}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchData} tintColor="#0D7377" />}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View className="flex-row justify-between items-start mb-8 mt-4">
          <View>
            <Text className="text-3xl font-bold text-[#111827] mb-1" style={{ fontFamily: 'PlusJakartaSans_700Bold' }}>
              {MONTH_NAMES[month]} {year}
            </Text>
            <Text className="text-sm text-[#6B7280] uppercase tracking-widest" style={{ fontFamily: 'PlusJakartaSans_700Bold' }}>
              {renewalsThisMonth} Renewals
            </Text>
          </View>
          <View className="flex-row items-center bg-white rounded-full px-1 py-1 shadow-sm border border-gray-100">
            <TouchableOpacity onPress={handlePrevMonth} className="p-2">
              <Feather name="chevron-left" size={18} color="#4B5563" />
            </TouchableOpacity>
            <TouchableOpacity onPress={handleToday} className="px-3 border-x border-gray-100">
              <Text className="text-sm font-bold text-[#0D7377]" style={{ fontFamily: 'PlusJakartaSans_700Bold' }}>Today</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleNextMonth} className="p-2">
              <Feather name="chevron-right" size={18} color="#4B5563" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Calendar Grid */}
        <View className="bg-white rounded-[24px] shadow-sm border border-gray-100 overflow-hidden mb-8">
          {/* Day Headers */}
          <View className="flex-row border-b border-gray-100 bg-[#F4F6F9]">
            {DAYS.map(day => (
              <View key={day} className="flex-1 py-3 items-center">
                <Text className="text-[10px] font-bold text-[#6B7280] tracking-widest uppercase" style={{ fontFamily: 'PlusJakartaSans_700Bold' }}>{day}</Text>
              </View>
            ))}
          </View>
          
          {/* Dates */}
          <View className="flex-row flex-wrap p-2">
            {gridCells.map((day, index) => {
              if (day === null) {
                return (
                  <View key={`empty-${index}`} style={{ width: '14.28%', aspectRatio: 1 }} className="p-1">
                    <View className="flex-1 rounded-xl" />
                  </View>
                );
              }

              const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
              const isSelected = selectedDate.getDate() === day && selectedDate.getMonth() === month && selectedDate.getFullYear() === year;
              const isToday = new Date().getDate() === day && new Date().getMonth() === month && new Date().getFullYear() === year;
              const hasRenewals = !!subsByDate[dateStr];
              
              // We just use a single line color based on the first sub's category to match design simplicity
              const firstSubColor = hasRenewals ? (CATEGORY_COLORS[subsByDate[dateStr][0].category] || '#0D7377') : null;

              return (
                <TouchableOpacity
                  key={`day-${day}`}
                  onPress={() => setSelectedDate(new Date(year, month, day))}
                  style={{ width: '14.28%', aspectRatio: 1 }}
                  className="p-1"
                >
                  <View className={`flex-1 items-center justify-center rounded-xl border ${isSelected ? 'bg-[#14A085]/20 border-[#0D7377]' : isToday ? 'bg-[#F4F6F9] border-[#E5E7EB]' : 'border-transparent'}`}>
                    <Text className={`text-[13px] font-bold ${isSelected ? 'text-[#0D7377]' : isToday ? 'text-[#111827]' : 'text-[#4B5563]'}`} style={{ fontFamily: 'PlusJakartaSans_700Bold' }}>
                      {day}
                    </Text>
                    {hasRenewals && (
                      <View className="w-1.5 h-1.5 rounded-full mt-1" style={{ backgroundColor: firstSubColor as string }} />
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Upcoming for Selected Date */}
        <View className="flex-row justify-between items-center mb-6">
          <Text className="text-lg font-bold text-[#111827]" style={{ fontFamily: 'PlusJakartaSans_700Bold' }}>
            {MONTH_NAMES[selectedDate.getMonth()].slice(0,3)} {selectedDate.getDate()}
          </Text>
          {selectedTotal > 0 && (
            <View className="bg-[#14A085]/20 px-3 py-1 rounded-full border border-[#14A085]/30">
              <Text className="text-[10px] font-bold text-[#0D7377] tracking-widest uppercase" style={{ fontFamily: 'PlusJakartaSans_700Bold' }}>
                {getCurrencySymbol(baseCurrency)}{selectedTotal.toFixed(0)} Due
              </Text>
            </View>
          )}
        </View>

        {selectedSubs.length === 0 ? (
           <View className="items-center justify-center py-8">
             <Text className="text-[#6B7280] text-sm" style={{ fontFamily: 'PlusJakartaSans_500Medium' }}>No renewals scheduled for this day.</Text>
           </View>
        ) : (
          selectedSubs.map((sub, idx) => (
            <TouchableOpacity
              key={sub.id}
              onPress={() => router.push(`/subscription/${sub.id}`)}
              className="bg-white p-4 rounded-[24px] shadow-sm border border-gray-100 flex-row items-center mb-4"
            >
              <View className="mr-4">
                <SubscriptionLogo name={sub.name} size={48} />
              </View>
              <View className="flex-1">
                <Text className="text-base font-bold text-[#111827] mb-1" style={{ fontFamily: 'PlusJakartaSans_700Bold' }}>{sub.name}</Text>
                <Text className="text-[10px] font-bold text-[#6B7280] uppercase tracking-widest" style={{ fontFamily: 'PlusJakartaSans_700Bold' }}>
                  {sub.category}
                </Text>
              </View>
              <View className="items-end">
                <Text className="text-lg font-bold text-[#0D7377] mb-1" style={{ fontFamily: 'PlusJakartaSans_700Bold' }}>
                  {getCurrencySymbol(sub.currency)}{Number(sub.cost).toFixed(0)}
                </Text>
                <View className="flex-row items-center" style={{ gap: 4 }}>
                  {sub.currency !== baseCurrency ? (
                    <View style={{ backgroundColor: '#E0F2FE', paddingHorizontal: 5, paddingVertical: 1, borderRadius: 4 }}>
                      <Text style={{ fontSize: 9, fontFamily: 'PlusJakartaSans_700Bold', color: '#0369A1' }}>{sub.currency}</Text>
                    </View>
                  ) : null}
                  <Text className="text-[9px] font-bold text-[#9CA3AF] uppercase tracking-widest" style={{ fontFamily: 'PlusJakartaSans_700Bold' }}>
                    {sub.billingCycle}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          ))
        )}

        {/* Add another renewal button */}
        <TouchableOpacity
          onPress={() => router.push(`/add-subscription?date=${selectedDateStr}`)}
          className="border-2 border-dashed border-[#E5E7EB] rounded-[24px] p-4 flex-row items-center justify-center mt-4 bg-transparent"
        >
          <View className="w-8 h-8 rounded-full bg-[#F4F6F9] items-center justify-center mr-3">
            <Feather name="plus" size={16} color="#6B7280" />
          </View>
          <Text className="text-[#6B7280] font-bold text-[13px]" style={{ fontFamily: 'PlusJakartaSans_700Bold' }}>
            Add renewal on this date
          </Text>
        </TouchableOpacity>

      </ScrollView>
    </View>
  );
}
