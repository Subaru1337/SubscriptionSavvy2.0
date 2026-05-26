import { View, Text, ActivityIndicator, ScrollView, RefreshControl, TouchableOpacity } from 'react-native';
import { useState, useEffect, useCallback } from 'react';
import { api } from '../../lib/api';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Notifications from 'expo-notifications';

export default function SubscriptionsScreen() {
  const [loading, setLoading] = useState(true);
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const router = useRouter();

  const fetchData = useCallback(async () => {
    try {
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

  const scheduleReminder = async (name: string, originalDateStr: string, cost: string, cycle: string) => {
    const triggerDate = new Date(originalDateStr);
    
    // Increment date for the next cycle
    if (cycle === 'monthly') {
      triggerDate.setMonth(triggerDate.getMonth() + 1);
    } else {
      triggerDate.setFullYear(triggerDate.getFullYear() + 1);
    }
    
    triggerDate.setDate(triggerDate.getDate() - 1); // 1 day before
    triggerDate.setHours(9, 0, 0, 0); // 9:00 AM

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

  const handlePay = async (sub: any) => {
    try {
      await api.post(`/subscriptions/${sub.id}/pay`);
      
      const settings = await Notifications.getPermissionsAsync();
      if (settings.granted) {
        await scheduleReminder(sub.name, sub.nextPayment, `${sub.currency} ${sub.cost}`, sub.billingCycle);
      }
      
      fetchData();
    } catch (error) {
      console.error(error);
    }
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
      <ScrollView 
        className="flex-1 p-4"
        refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchData} />}
      >
        <Text className="text-2xl font-bold text-text-primary mb-6">Your Subscriptions</Text>

        {subscriptions.map(sub => {
          const nextPaymentDate = new Date(sub.nextPayment);
          const isOverdue = nextPaymentDate < new Date();
          
          return (
            <View key={sub.id} className="bg-card p-4 rounded-2xl shadow-sm border border-border mb-4">
              <View className="flex-row justify-between items-start mb-2">
                <Text className="text-lg font-bold text-text-primary">{sub.name}</Text>
                <Text className="text-lg font-bold text-primary">
                  {sub.currency} {sub.cost.toString()}
                </Text>
              </View>
              
              <Text className="text-text-secondary mb-4">
                {sub.billingCycle} • Next payment: {nextPaymentDate.toLocaleDateString()}
              </Text>
              
              <View className="flex-row justify-end space-x-2">
                <TouchableOpacity 
                  onPress={() => handlePay(sub)}
                  className={`px-4 py-2 rounded-lg flex-row items-center space-x-2 ${isOverdue ? 'bg-overdue' : 'bg-primary'}`}
                >
                  <Feather name="check" size={16} color="white" />
                  <Text className="text-white font-medium">Mark as Paid</Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        })}
        
        {subscriptions.length === 0 && !loading && (
          <Text className="text-center text-text-secondary mt-10">No subscriptions found.</Text>
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
