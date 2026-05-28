import {
  View, Text, ScrollView, RefreshControl,
  TouchableOpacity, ActivityIndicator
} from 'react-native';
import { useState, useCallback, useEffect, useMemo } from 'react';
import { api } from '../../lib/api';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

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
  Entertainment: '#0D7377',
  Productivity: '#F59E0B',
  Health: '#10B981',
  Education: '#3B82F6',
  Finance: '#8B5CF6',
  Shopping: '#EC4899',
  'Developer Tools': '#6366F1',
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

export default function CalendarScreen() {
  const [loading, setLoading] = useState(true);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const router = useRouter();

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

  useEffect(() => {
    fetchData();
  }, [fetchData]);

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

  return (
    <View className="flex-1 bg-[#F9FAFB]">
      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchData} />}
      >
        {/* Header */}
        <View className="flex-row justify-between items-start mb-6 mt-2">
          <View>
            <Text className="text-2xl font-bold text-gray-900">
              {MONTH_NAMES[month]}
            </Text>
            <Text className="text-2xl font-bold text-gray-900 mb-1">
              {year}
            </Text>
            <Text className="text-sm text-gray-500">
              {renewalsThisMonth} renewals this month
            </Text>
          </View>
          <View className="flex-row items-center bg-gray-100 rounded-full px-1 py-1">
            <TouchableOpacity onPress={handlePrevMonth} className="p-2">
              <Feather name="chevron-left" size={18} color="#4B5563" />
            </TouchableOpacity>
            <TouchableOpacity onPress={handleToday} className="px-3">
              <Text className="text-sm font-bold text-[#0D7377]">Today</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleNextMonth} className="p-2">
              <Feather name="chevron-right" size={18} color="#4B5563" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Calendar Grid */}
        <View className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-6">
          {/* Day Headers */}
          <View className="flex-row border-b border-gray-200 bg-gray-50">
            {DAYS.map(day => (
              <View key={day} className="flex-1 py-3 items-center">
                <Text className="text-[10px] font-bold text-gray-500">{day}</Text>
              </View>
            ))}
          </View>
          
          {/* Dates */}
          <View className="flex-row flex-wrap">
            {gridCells.map((day, index) => {
              if (day === null) {
                return (
                  <View key={`empty-${index}`} style={{ width: '14.28%', aspectRatio: 1 }} className="border-b border-r border-gray-100" />
                );
              }

              const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
              const isSelected = selectedDate.getDate() === day && selectedDate.getMonth() === month && selectedDate.getFullYear() === year;
              const hasRenewals = !!subsByDate[dateStr];
              
              // We just use a single line color based on the first sub's category to match design simplicity
              const firstSubColor = hasRenewals ? (CATEGORY_COLORS[subsByDate[dateStr][0].category] || '#0D7377') : null;

              return (
                <TouchableOpacity
                  key={`day-${day}`}
                  onPress={() => setSelectedDate(new Date(year, month, day))}
                  style={{ width: '14.28%', aspectRatio: 1 }}
                  className={`border-b border-r border-gray-100 p-1 ${isSelected ? 'bg-teal-50 border-2 border-[#0D7377]' : ''}`}
                >
                  <Text className={`text-xs font-bold pl-1 ${isSelected ? 'text-[#0D7377]' : 'text-gray-700'}`}>
                    {day}
                  </Text>
                  <View className="flex-1 justify-end items-center pb-1">
                    {hasRenewals && (
                      <View className="w-4/5 h-1 rounded-full mb-0.5" style={{ backgroundColor: firstSubColor as string }} />
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Upcoming for Selected Date */}
        <View className="flex-row justify-between items-center mb-4">
          <Text className="text-lg font-bold text-gray-900">
            Upcoming ({MONTH_NAMES[selectedDate.getMonth()].slice(0,3)} {selectedDate.getDate()})
          </Text>
          {selectedTotal > 0 && (
            <View className="bg-teal-50 px-3 py-1 rounded-full">
              <Text className="text-xs font-bold text-[#0D7377]">
                Total ₹{selectedTotal.toFixed(2)}
              </Text>
            </View>
          )}
        </View>

        {selectedSubs.map(sub => (
          <TouchableOpacity
            key={sub.id}
            onPress={() => router.push(`/subscription/${sub.id}`)}
            className="bg-white p-3 rounded-2xl shadow-sm border border-gray-100 flex-row items-center mb-3"
          >
            <View 
              className="w-12 h-12 rounded-xl items-center justify-center mr-3"
              style={{ backgroundColor: '#1F2937' }} // Dark background matching design's logo placeholders
            >
              <Text className="text-white font-bold text-xl uppercase">
                {sub.name.charAt(0)}
              </Text>
            </View>
            <View className="flex-1">
              <Text className="text-sm font-medium text-gray-900 mb-1">{sub.name}</Text>
              <View className="bg-teal-50 self-start px-2 py-0.5 rounded-md">
                <Text className="text-[8px] font-bold text-[#0D7377] uppercase tracking-widest">
                  {sub.category}
                </Text>
              </View>
            </View>
            <View className="items-end">
              <Text className="text-base font-bold text-[#0D7377] mb-1">
                ₹{Number(sub.cost).toFixed(2)}
              </Text>
              <Text className="text-[9px] font-medium text-gray-500 uppercase">
                {sub.billingCycle}
              </Text>
            </View>
          </TouchableOpacity>
        ))}

        {/* Add another renewal button */}
        <TouchableOpacity
          onPress={() => router.push(`/add-subscription?date=${selectedDateStr}`)}
          className="border border-dashed border-gray-300 rounded-2xl p-4 flex-row items-center justify-center mt-2 bg-gray-50"
        >
          <View className="w-8 h-8 rounded-full bg-gray-200 items-center justify-center mr-3">
            <Feather name="plus" size={16} color="#6B7280" />
          </View>
          <Text className="text-gray-600 font-medium text-sm">
            Add another renewal for this date
          </Text>
        </TouchableOpacity>

      </ScrollView>
    </View>
  );
}
