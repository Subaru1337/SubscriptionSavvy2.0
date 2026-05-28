import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  Alert, ActivityIndicator
} from 'react-native';
import { useState, useEffect } from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { api } from '../lib/api';
import * as Notifications from 'expo-notifications';

const CATEGORIES = ['Entertainment', 'Productivity', 'Health', 'Education', 'Finance', 'Shopping', 'Developer Tools', 'Other'];
const CURRENCIES = ['USD', 'INR', 'EUR', 'GBP', 'AED', 'SGD', 'AUD', 'CAD'];
const STATUSES = ['active', 'paused', 'cancelled'];

function ChipSelector({ label, options, value, onChange }: {
  label: string; options: string[]; value: string; onChange: (v: string) => void;
}) {
  return (
    <View className="mb-4">
      <Text className="text-text-primary font-medium mb-2">{label}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View className="flex-row space-x-2">
          {options.map((opt) => (
            <TouchableOpacity
              key={opt}
              onPress={() => onChange(opt)}
              className={`px-3 py-2 rounded-full border ${value === opt ? 'bg-primary border-primary' : 'bg-background border-border'}`}
            >
              <Text className={value === opt ? 'text-white font-medium text-sm' : 'text-text-primary text-sm'}>
                {opt}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

function StarRating({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <View className="flex-row space-x-2">
      {[1, 2, 3, 4, 5].map((star) => (
        <TouchableOpacity key={star} onPress={() => onChange(star)}>
          <Text className={`text-2xl ${star <= value ? 'text-yellow-400' : 'text-gray-300'}`}>★</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

export default function AddSubscriptionScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(!!id);

  const [form, setForm] = useState({
    name: '',
    cost: '',
    currency: 'USD',
    billingCycle: 'monthly' as 'monthly' | 'yearly',
    category: 'Entertainment',
    nextPayment: new Date().toISOString().split('T')[0],
    status: 'active',
    notes: '',
    trialEndsOn: '',
    worthItRating: 0,
  });

  useEffect(() => {
    if (id) {
      setFetching(true);
      api.get(`/subscriptions/${id}`)
        .then(res => {
          const sub = res.data.subscription;
          setForm({
            name: sub.name,
            cost: String(sub.cost),
            currency: sub.currency,
            billingCycle: sub.billingCycle,
            category: sub.category,
            nextPayment: sub.nextPayment ? sub.nextPayment.split('T')[0] : '',
            status: sub.status,
            notes: sub.notes || '',
            trialEndsOn: sub.trialEndsOn ? sub.trialEndsOn.split('T')[0] : '',
            worthItRating: sub.worthItRating || 0,
          });
        })
        .catch(() => Alert.alert('Error', 'Failed to load subscription details'))
        .finally(() => setFetching(false));
    }
  }, [id]);

  const scheduleReminder = async (name: string, dateStr: string, cost: string) => {
    const triggerDate = new Date(dateStr);
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

  const handleSubmit = async () => {
    if (!form.name || !form.cost) {
      Alert.alert('Error', 'Please fill in Name and Cost');
      return;
    }
    const costNum = parseFloat(form.cost);
    if (isNaN(costNum) || costNum <= 0) {
      Alert.alert('Error', 'Cost must be a positive number');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        name: form.name,
        cost: costNum,
        currency: form.currency,
        billingCycle: form.billingCycle,
        category: form.category,
        nextPayment: form.nextPayment,
        status: form.status,
        notes: form.notes || null,
        trialEndsOn: form.trialEndsOn || null,
        worthItRating: form.worthItRating,
      };

      if (id) {
        await api.put(`/subscriptions/${id}`, payload);
      } else {
        await api.post('/subscriptions', payload);
      }

      const settings = await Notifications.getPermissionsAsync();
      if (settings.granted && form.status === 'active') {
        await scheduleReminder(form.name, form.nextPayment, `${form.currency} ${form.cost}`);
      }

      // Update worth-it rating after creation if set
      router.back();
    } catch (error: any) {
      if (error?.response?.status === 409 && error?.response?.data?.existing) {
        const ext = error.response.data.existing;
        Alert.alert('Duplicate Found', `You already have a subscription to ${ext.name} (${ext.currency}${ext.cost}). Please use a different name or edit the existing one.`);
      } else {
        const msg = error?.response?.data?.error || 'Failed to save subscription';
        Alert.alert('Error', msg);
      }
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <View className="flex-1 bg-background justify-center items-center">
        <ActivityIndicator size="large" color="#0D7377" />
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-background" contentContainerStyle={{ padding: 16 }}>
      <View className="bg-card p-4 rounded-2xl shadow-sm border border-border mb-4">
        <Text className="text-text-primary font-medium mb-2">Service Name *</Text>
        <TextInput
          className="bg-background border border-border rounded-lg p-3 mb-4 text-text-primary"
          placeholder="Netflix, Spotify..."
          placeholderTextColor="#9CA3AF"
          value={form.name}
          onChangeText={(t) => setForm({ ...form, name: t })}
        />

        <Text className="text-text-primary font-medium mb-2">Cost *</Text>
        <TextInput
          className="bg-background border border-border rounded-lg p-3 mb-4 text-text-primary"
          placeholder="15.99"
          placeholderTextColor="#9CA3AF"
          keyboardType="decimal-pad"
          value={form.cost}
          onChangeText={(t) => setForm({ ...form, cost: t })}
        />

        <ChipSelector label="Currency" options={CURRENCIES} value={form.currency} onChange={(v) => setForm({ ...form, currency: v })} />
        <ChipSelector label="Category" options={CATEGORIES} value={form.category} onChange={(v) => setForm({ ...form, category: v })} />

        <Text className="text-text-primary font-medium mb-2">Billing Cycle</Text>
        <View className="flex-row space-x-2 mb-4">
          {['monthly', 'yearly'].map((cycle) => (
            <TouchableOpacity
              key={cycle}
              className={`flex-1 p-3 rounded-lg border items-center ${form.billingCycle === cycle ? 'bg-primary border-primary' : 'bg-background border-border'}`}
              onPress={() => setForm({ ...form, billingCycle: cycle as 'monthly' | 'yearly' })}
            >
              <Text className={form.billingCycle === cycle ? 'text-white font-medium' : 'text-text-primary'}>
                {cycle.charAt(0).toUpperCase() + cycle.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <ChipSelector label="Status" options={STATUSES} value={form.status} onChange={(v) => setForm({ ...form, status: v })} />

        <Text className="text-text-primary font-medium mb-2">Next Payment Date (YYYY-MM-DD) *</Text>
        <TextInput
          className="bg-background border border-border rounded-lg p-3 mb-4 text-text-primary"
          value={form.nextPayment}
          placeholderTextColor="#9CA3AF"
          onChangeText={(t) => setForm({ ...form, nextPayment: t })}
        />

        <Text className="text-text-primary font-medium mb-2">Trial Ends On (YYYY-MM-DD, optional)</Text>
        <TextInput
          className="bg-background border border-border rounded-lg p-3 mb-4 text-text-primary"
          placeholder="Leave empty if no trial"
          placeholderTextColor="#9CA3AF"
          value={form.trialEndsOn}
          onChangeText={(t) => setForm({ ...form, trialEndsOn: t })}
        />

        <Text className="text-text-primary font-medium mb-2">Notes (optional)</Text>
        <TextInput
          className="bg-background border border-border rounded-lg p-3 mb-4 text-text-primary"
          placeholder="Any notes about this subscription..."
          placeholderTextColor="#9CA3AF"
          value={form.notes}
          onChangeText={(t) => setForm({ ...form, notes: t })}
          multiline
          numberOfLines={3}
          textAlignVertical="top"
        />

        <Text className="text-text-primary font-medium mb-2">Worth It Rating</Text>
        <View className="mb-4">
          <StarRating value={form.worthItRating} onChange={(v) => setForm({ ...form, worthItRating: v })} />
          <Text className="text-text-secondary text-xs mt-1">
            {form.worthItRating === 0 ? 'Not rated' : ['', 'Poor', 'Fair', 'Good', 'Great', 'Excellent'][form.worthItRating]}
          </Text>
        </View>

        <TouchableOpacity
          className="bg-primary p-4 rounded-lg items-center"
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text className="text-white font-bold text-lg">{id ? 'Save Changes' : 'Save Subscription'}</Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
