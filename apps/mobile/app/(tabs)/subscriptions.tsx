import {
  View, Text, ActivityIndicator, ScrollView, RefreshControl,
  TouchableOpacity, Alert
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

const STATUS_COLORS: Record<string, string> = {
  active: '#10B981',
  paused: '#F59E0B',
  cancelled: '#EF4444',
};

const FILTER_TABS = ['Active', 'All', 'Paused', 'Cancelled'];

export default function SubscriptionsScreen() {
  const [loading, setLoading] = useState(true);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [filter, setFilter] = useState('Active');
  const router = useRouter();

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const statusParam = filter === 'Active' ? '' : '?status=all';
      const response = await api.get(`/subscriptions${statusParam}`);
      let subs: Subscription[] = Array.isArray(response.data)
        ? response.data
        : response.data?.subscriptions ?? [];

      // Client-side filter for Paused/Cancelled (API returns all when ?status=all)
      if (filter === 'Paused') {
        subs = subs.filter((s) => s.status === 'paused');
      } else if (filter === 'Cancelled') {
        subs = subs.filter((s) => s.status === 'cancelled');
      }

      setSubscriptions(subs);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const scheduleReminder = async (
    name: string, originalDateStr: string, cost: string, cycle: string
  ) => {
    const triggerDate = new Date(originalDateStr);
    if (cycle === 'monthly') {
      triggerDate.setMonth(triggerDate.getMonth() + 1);
    } else {
      triggerDate.setFullYear(triggerDate.getFullYear() + 1);
    }
    triggerDate.setDate(triggerDate.getDate() - 1);
    triggerDate.setHours(9, 0, 0, 0);
    if (triggerDate > new Date()) {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: "Payment Reminder 📅",
          body: `Your subscription to ${name} (${cost}) is due tomorrow!`,
        },
        trigger: triggerDate,
      });
    }
  };

  const handlePay = async (sub: Subscription) => {
    try {
      await api.post(`/subscriptions/${sub.id}/pay`);
      const settings = await Notifications.getPermissionsAsync();
      if (settings.granted) {
        await scheduleReminder(
          sub.name, sub.nextPayment,
          `${sub.currency} ${sub.cost}`, sub.billingCycle
        );
      }
      fetchData();
    } catch (error: any) {
      const msg = error?.response?.data?.error || 'Failed to mark as paid';
      Alert.alert('Error', msg);
    }
  };

  const handleDelete = (sub: Subscription) => {
    Alert.alert(
      'Delete Subscription',
      `Are you sure you want to delete "${sub.name}"? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.delete(`/subscriptions/${sub.id}`);
              fetchData();
            } catch {
              Alert.alert('Error', 'Failed to delete subscription');
            }
          },
        },
      ]
    );
  };

  if (loading && subscriptions.length === 0) {
    return (
      <View className="flex-1 justify-center items-center bg-background">
        <ActivityIndicator size="large" color="#0D7377" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background">
      {/* Filter Tabs */}
      <View className="flex-row border-b border-border bg-white">
        {FILTER_TABS.map((tab) => (
          <TouchableOpacity
            key={tab}
            onPress={() => setFilter(tab)}
            className="flex-1 py-3 items-center"
          >
            <Text
              className={`text-sm font-medium ${filter === tab ? 'text-primary' : 'text-text-secondary'}`}
            >
              {tab}
            </Text>
            {filter === tab && (
              <View className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
            )}
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        className="flex-1 p-4"
        refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchData} />}
      >
        <Text className="text-2xl font-bold text-text-primary mb-4">Your Subscriptions</Text>

        {subscriptions.map((sub) => {
          const nextPaymentDate = new Date(sub.nextPayment);
          const isOverdue = nextPaymentDate < new Date();
          const statusColor = STATUS_COLORS[sub.status] || '#6B6560';

          return (
            <TouchableOpacity
              key={sub.id}
              onPress={() => router.push(`/subscription/${sub.id}`)}
              className="bg-card rounded-2xl shadow-sm border border-border mb-4 overflow-hidden"
            >
              {/* Status bar */}
              <View style={{ height: 4, backgroundColor: statusColor }} />

              <View className="p-4">
                <View className="flex-row justify-between items-start mb-1">
                  <View className="flex-1 mr-2">
                    <Text className="text-lg font-bold text-text-primary" numberOfLines={1}>
                      {sub.name}
                    </Text>
                    <Text className="text-text-secondary text-xs capitalize">{sub.category}</Text>
                  </View>
                  <View className="items-end">
                    <Text className="text-lg font-bold text-primary">
                      {sub.currency} {Number(sub.cost).toFixed(2)}
                    </Text>
                    <Text className="text-text-secondary text-xs capitalize">{sub.billingCycle}</Text>
                  </View>
                </View>

                <View className="flex-row items-center justify-between mt-2">
                  <View className="flex-row items-center space-x-1">
                    <Feather name="clock" size={12} color={isOverdue ? '#EF4444' : '#6B6560'} />
                    <Text className={`text-xs ${isOverdue ? 'text-overdue font-medium' : 'text-text-secondary'}`}>
                      {isOverdue ? 'Overdue · ' : 'Due · '}
                      {nextPaymentDate.toLocaleDateString()}
                    </Text>
                  </View>
                  <View
                    className="px-2 py-0.5 rounded-full"
                    style={{ backgroundColor: `${statusColor}20` }}
                  >
                    <Text className="text-xs font-medium capitalize" style={{ color: statusColor }}>
                      {sub.status}
                    </Text>
                  </View>
                </View>

                {sub.worthItRating && (
                  <Text className="text-yellow-400 text-xs mt-1">
                    {'★'.repeat(sub.worthItRating)}{'☆'.repeat(5 - sub.worthItRating)}
                  </Text>
                )}

                {/* Actions */}
                <View className="flex-row justify-end space-x-2 mt-3 pt-3 border-t border-border">
                  <TouchableOpacity
                    onPress={() => handleDelete(sub)}
                    className="flex-row items-center space-x-1 px-3 py-2 rounded-lg border border-red-200 bg-red-50"
                  >
                    <Feather name="trash-2" size={14} color="#EF4444" />
                    <Text className="text-overdue text-sm font-medium">Delete</Text>
                  </TouchableOpacity>

                  {sub.status === 'active' && isOverdue && (
                    <TouchableOpacity
                      onPress={() => handlePay(sub)}
                      className="flex-row items-center space-x-1 px-3 py-2 rounded-lg bg-primary"
                    >
                      <Feather name="check" size={14} color="white" />
                      <Text className="text-white text-sm font-medium">Mark Paid</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            </TouchableOpacity>
          );
        })}

        {subscriptions.length === 0 && !loading && (
          <View className="flex-1 items-center justify-center mt-20">
            <Feather name="inbox" size={48} color="#9CA3AF" />
            <Text className="text-center text-text-secondary mt-4 text-base">
              No {filter.toLowerCase()} subscriptions found.
            </Text>
          </View>
        )}
      </ScrollView>

      <TouchableOpacity
        onPress={() => router.push('/add-subscription')}
        className="absolute bottom-6 right-6 w-14 h-14 bg-primary rounded-full items-center justify-center shadow-lg"
      >
        <Feather name="plus" size={24} color="white" />
      </TouchableOpacity>
    </View>
  );
}
