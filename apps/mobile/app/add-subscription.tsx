import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { api } from '../lib/api';
import * as Notifications from 'expo-notifications';

export default function AddSubscriptionScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  
  const [form, setForm] = useState({
    name: '',
    cost: '',
    currency: 'USD',
    billingCycle: 'monthly',
    category: 'Entertainment',
    nextPayment: new Date().toISOString().split('T')[0]
  });

  const scheduleReminder = async (name: string, dateStr: string, cost: string) => {
    const triggerDate = new Date(dateStr);
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

  const handleSubmit = async () => {
    if (!form.name || !form.cost) {
      Alert.alert('Error', 'Please fill in name and cost');
      return;
    }

    setLoading(true);
    try {
      await api.post('/subscriptions', {
        ...form,
        cost: parseFloat(form.cost)
      });
      
      // Schedule reminder if permission is granted
      const settings = await Notifications.getPermissionsAsync();
      if (settings.granted) {
        await scheduleReminder(form.name, form.nextPayment, `${form.currency} ${form.cost}`);
      }

      router.back();
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Failed to add subscription');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView className="flex-1 bg-background p-4">
      <View className="bg-card p-4 rounded-2xl shadow-sm border border-border mb-6">
        
        <Text className="text-text-primary font-medium mb-2">Service Name</Text>
        <TextInput 
          className="bg-background border border-border rounded-lg p-3 mb-4 text-text-primary"
          placeholder="Netflix, Spotify..."
          value={form.name}
          onChangeText={(text) => setForm({...form, name: text})}
        />

        <Text className="text-text-primary font-medium mb-2">Cost</Text>
        <TextInput 
          className="bg-background border border-border rounded-lg p-3 mb-4 text-text-primary"
          placeholder="15.99"
          keyboardType="numeric"
          value={form.cost}
          onChangeText={(text) => setForm({...form, cost: text})}
        />

        <Text className="text-text-primary font-medium mb-2">Currency (e.g., USD, EUR, INR)</Text>
        <TextInput 
          className="bg-background border border-border rounded-lg p-3 mb-4 text-text-primary"
          value={form.currency}
          onChangeText={(text) => setForm({...form, currency: text})}
          autoCapitalize="characters"
        />

        <Text className="text-text-primary font-medium mb-2">Category</Text>
        <TextInput 
          className="bg-background border border-border rounded-lg p-3 mb-4 text-text-primary"
          value={form.category}
          onChangeText={(text) => setForm({...form, category: text})}
        />

        <Text className="text-text-primary font-medium mb-2">Billing Cycle</Text>
        <View className="flex-row space-x-2 mb-4">
          {['monthly', 'yearly'].map((cycle) => (
            <TouchableOpacity 
              key={cycle}
              className={`flex-1 p-3 rounded-lg border items-center ${form.billingCycle === cycle ? 'bg-primary border-primary' : 'bg-background border-border'}`}
              onPress={() => setForm({...form, billingCycle: cycle})}
            >
              <Text className={form.billingCycle === cycle ? 'text-white font-medium' : 'text-text-primary'}>
                {cycle.charAt(0).toUpperCase() + cycle.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text className="text-text-primary font-medium mb-2">Next Payment Date (YYYY-MM-DD)</Text>
        <TextInput 
          className="bg-background border border-border rounded-lg p-3 mb-6 text-text-primary"
          value={form.nextPayment}
          onChangeText={(text) => setForm({...form, nextPayment: text})}
        />

        <TouchableOpacity 
          className="bg-primary p-4 rounded-lg items-center"
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text className="text-white font-bold text-lg">Save Subscription</Text>
          )}
        </TouchableOpacity>

      </View>
    </ScrollView>
  );
}
