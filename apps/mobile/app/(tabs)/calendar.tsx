import { View, Text, ActivityIndicator, ScrollView, RefreshControl } from 'react-native';
import { useState, useEffect, useCallback } from 'react';
import { api } from '../../lib/api';
import { Feather } from '@expo/vector-icons';

export default function CalendarScreen() {
  const [loading, setLoading] = useState(true);
  const [subscriptions, setSubscriptions] = useState<any[]>([]);

  const fetchData = useCallback(async () => {
    try {
      const response = await api.get('/subscriptions');
      // API may return an array directly or { subscriptions: [...] }
      const subs = Array.isArray(response.data)
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

  // Group subscriptions by date
  const grouped = subscriptions.reduce((acc, sub) => {
    const dateStr = new Date(sub.nextPayment).toISOString().split('T')[0];
    if (!acc[dateStr]) acc[dateStr] = [];
    acc[dateStr].push(sub);
    return acc;
  }, {} as Record<string, any[]>);

  // Sort dates
  const sortedDates = Object.keys(grouped).sort((a, b) => new Date(a).getTime() - new Date(b).getTime());

  if (loading && subscriptions.length === 0) {
    return (
      <View className="flex-1 justify-center items-center bg-background">
        <ActivityIndicator size="large" color="#0D7377" />
      </View>
    );
  }

  return (
    <ScrollView 
      className="flex-1 bg-background p-4"
      refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchData} />}
    >
      <Text className="text-2xl font-bold text-text-primary mb-6">Upcoming Payments</Text>

      {sortedDates.map((dateStr) => {
        const dateObj = new Date(dateStr);
        const isPast = dateObj < new Date(new Date().setHours(0,0,0,0));
        
        return (
          <View key={dateStr} className="mb-6">
            <View className="flex-row items-center space-x-2 mb-3">
              <Feather name="calendar" size={18} color={isPast ? '#EF4444' : '#6B6560'} />
              <Text className={`font-bold text-lg ${isPast ? 'text-overdue' : 'text-text-secondary'}`}>
                {dateObj.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
              </Text>
            </View>

            {grouped[dateStr].map(sub => (
              <View key={sub.id} className="bg-card p-4 rounded-xl shadow-sm border border-border mb-2 flex-row justify-between items-center">
                <Text className="text-text-primary font-medium">{sub.name}</Text>
                <Text className="text-primary font-bold">{sub.currency} {sub.cost}</Text>
              </View>
            ))}
          </View>
        );
      })}

      {subscriptions.length === 0 && !loading && (
        <Text className="text-center text-text-secondary mt-10">No upcoming payments found.</Text>
      )}
    </ScrollView>
  );
}
