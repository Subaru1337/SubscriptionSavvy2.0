import {
  View, Text, ScrollView, TextInput, TouchableOpacity,
  ActivityIndicator, Alert, RefreshControl
} from 'react-native';
import { useState, useEffect, useCallback } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { api } from '../../lib/api';
import { Feather } from '@expo/vector-icons';
import * as Notifications from 'expo-notifications';

const CATEGORIES = ['Entertainment', 'Productivity', 'Health', 'Education', 'Finance', 'Shopping', 'Developer Tools', 'Other'];
const CURRENCIES = ['USD', 'INR', 'EUR', 'GBP', 'AED', 'SGD', 'AUD', 'CAD'];
const STATUSES = ['active', 'paused', 'cancelled'];

const STATUS_COLORS: Record<string, string> = {
  active: '#10B981',
  paused: '#F59E0B',
  cancelled: '#EF4444',
};

function ChipSelector({ label, options, value, onChange }: {
  label: string; options: string[]; value: string; onChange: (v: string) => void;
}) {
  return (
    <View className="mb-4">
      <Text className="text-text-secondary text-xs mb-1">{label}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View className="flex-row space-x-2">
          {options.map((opt) => (
            <TouchableOpacity
              key={opt}
              onPress={() => onChange(opt)}
              className={`px-3 py-1.5 rounded-full border ${value === opt ? 'bg-primary border-primary' : 'bg-background border-border'}`}
            >
              <Text className={value === opt ? 'text-white font-medium text-xs' : 'text-text-primary text-xs'}>
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
    <View className="flex-row space-x-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <TouchableOpacity key={star} onPress={() => onChange(star)}>
          <Text className={`text-xl ${star <= value ? 'text-yellow-400' : 'text-gray-300'}`}>★</Text>
        </TouchableOpacity>
      ))}
      {value > 0 && (
        <TouchableOpacity onPress={() => onChange(0)} className="ml-2 self-center">
          <Text className="text-text-secondary text-xs">Clear</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

type PriceRecord = {
  id: string;
  oldCost: string | number;
  newCost: string | number;
  currency: string;
  changedAt: string;
};

export default function SubscriptionDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [paying, setPaying] = useState(false);
  const [editing, setEditing] = useState(false);
  const [priceHistory, setPriceHistory] = useState<PriceRecord[]>([]);

  const [sub, setSub] = useState<any>(null);
  const [form, setForm] = useState<any>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch sub from list (no single-sub GET endpoint)
      const res = await api.get('/subscriptions?status=all');
      const subs = Array.isArray(res.data) ? res.data : res.data?.subscriptions ?? [];
      const found = subs.find((s: any) => s.id === id);
      if (!found) {
        Alert.alert('Error', 'Subscription not found');
        router.back();
        return;
      }
      setSub(found);
      setForm({
        name: found.name,
        cost: String(Number(found.cost).toFixed(2)),
        currency: found.currency,
        billingCycle: found.billingCycle,
        category: found.category,
        nextPayment: found.nextPayment?.split('T')[0] ?? '',
        status: found.status,
        notes: found.notes ?? '',
        trialEndsOn: found.trialEndsOn ? found.trialEndsOn.split('T')[0] : '',
        worthItRating: found.worthItRating ?? 0,
      });

      // Price history
      const histRes = await api.get(`/subscriptions/${id}/price-history`);
      setPriceHistory(histRes.data?.history ?? []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleSave = async () => {
    if (!form.name || !form.cost) {
      Alert.alert('Error', 'Name and Cost are required');
      return;
    }
    const costNum = parseFloat(form.cost);
    if (isNaN(costNum) || costNum <= 0) {
      Alert.alert('Error', 'Cost must be a positive number');
      return;
    }
    setSaving(true);
    try {
      await api.put(`/subscriptions/${id}`, {
        name: form.name,
        cost: costNum,
        currency: form.currency,
        billingCycle: form.billingCycle,
        category: form.category,
        nextPayment: form.nextPayment,
        status: form.status,
        notes: form.notes || null,
        trialEndsOn: form.trialEndsOn || null,
        worthItRating: form.worthItRating > 0 ? form.worthItRating : null,
      });
      setEditing(false);
      fetchData();
      Alert.alert('Saved', 'Subscription updated successfully');
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.error ?? 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handlePay = async () => {
    Alert.alert(
      'Mark as Paid',
      `Mark "${sub.name}" as paid? The next payment date will be advanced by one ${sub.billingCycle === 'yearly' ? 'year' : 'month'}.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: async () => {
            setPaying(true);
            try {
              await api.post(`/subscriptions/${id}/pay`);
              const perms = await Notifications.getPermissionsAsync();
              if (perms.granted) {
                const triggerDate = new Date(sub.nextPayment);
                if (sub.billingCycle === 'monthly') triggerDate.setMonth(triggerDate.getMonth() + 1);
                else triggerDate.setFullYear(triggerDate.getFullYear() + 1);
                triggerDate.setDate(triggerDate.getDate() - 1);
                triggerDate.setHours(9, 0, 0, 0);
                if (triggerDate > new Date()) {
                  await Notifications.scheduleNotificationAsync({
                    content: {
                      title: 'Payment Reminder 📅',
                      body: `${sub.name} (${sub.currency} ${Number(sub.cost).toFixed(2)}) is due tomorrow!`,
                    },
                    trigger: triggerDate,
                  });
                }
              }
              fetchData();
            } catch (err: any) {
              Alert.alert('Error', err?.response?.data?.error ?? 'Failed to mark as paid');
            } finally {
              setPaying(false);
            }
          },
        },
      ]
    );
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Subscription',
      `Delete "${sub?.name}"? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.delete(`/subscriptions/${id}`);
              router.back();
            } catch {
              Alert.alert('Error', 'Failed to delete subscription');
            }
          },
        },
      ]
    );
  };

  if (loading || !sub || !form) {
    return (
      <View className="flex-1 justify-center items-center bg-background">
        <ActivityIndicator size="large" color="#0D7377" />
      </View>
    );
  }

  const nextPaymentDate = new Date(sub.nextPayment);
  const isOverdue = nextPaymentDate < new Date();
  const statusColor = STATUS_COLORS[sub.status] ?? '#6B6560';

  return (
    <ScrollView
      className="flex-1 bg-background"
      contentContainerStyle={{ padding: 16 }}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchData} />}
    >
      {/* Header card */}
      <View className="bg-card rounded-2xl border border-border mb-4 overflow-hidden">
        <View style={{ height: 4, backgroundColor: statusColor }} />
        <View className="p-4">
          <View className="flex-row justify-between items-start mb-2">
            <Text className="text-2xl font-bold text-text-primary flex-1 mr-2">{sub.name}</Text>
            <View
              className="px-3 py-1 rounded-full"
              style={{ backgroundColor: `${statusColor}20` }}
            >
              <Text className="text-xs font-medium capitalize" style={{ color: statusColor }}>
                {sub.status}
              </Text>
            </View>
          </View>
          <Text className="text-3xl font-bold text-primary">
            {sub.currency} {Number(sub.cost).toFixed(2)}
            <Text className="text-base font-normal text-text-secondary"> / {sub.billingCycle}</Text>
          </Text>
          <Text className="text-text-secondary text-sm mt-1">{sub.category}</Text>
          {sub.worthItRating > 0 && (
            <Text className="text-yellow-400 mt-1">
              {'★'.repeat(sub.worthItRating)}{'☆'.repeat(5 - sub.worthItRating)}
              <Text className="text-text-secondary text-xs"> worth-it rating</Text>
            </Text>
          )}
        </View>
      </View>

      {/* Next payment info */}
      <View className="bg-card p-4 rounded-2xl border border-border mb-4">
        <View className="flex-row items-center justify-between">
          <View>
            <Text className="text-text-secondary text-xs">Next Payment</Text>
            <Text className={`text-lg font-bold ${isOverdue ? 'text-overdue' : 'text-text-primary'}`}>
              {nextPaymentDate.toLocaleDateString(undefined, { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}
            </Text>
            {isOverdue && <Text className="text-overdue text-xs">⚠ Overdue</Text>}
          </View>
          {sub.status === 'active' && (
            <TouchableOpacity
              onPress={handlePay}
              disabled={paying}
              className={`px-4 py-2.5 rounded-xl flex-row items-center space-x-2 ${isOverdue ? 'bg-overdue' : 'bg-primary'} ${!isOverdue ? 'opacity-60' : ''}`}
            >
              {paying ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <>
                  <Feather name="check-circle" size={16} color="white" />
                  <Text className="text-white font-medium">Mark Paid</Text>
                </>
              )}
            </TouchableOpacity>
          )}
        </View>
        {sub.trialEndsOn && (
          <View className="mt-3 pt-3 border-t border-border">
            <Text className="text-text-secondary text-xs">Trial Ends</Text>
            <Text className="text-text-primary font-medium">
              {new Date(sub.trialEndsOn).toLocaleDateString()}
            </Text>
          </View>
        )}
        {sub.notes && (
          <View className="mt-3 pt-3 border-t border-border">
            <Text className="text-text-secondary text-xs mb-1">Notes</Text>
            <Text className="text-text-primary text-sm">{sub.notes}</Text>
          </View>
        )}
      </View>

      {/* Edit / Delete buttons */}
      <View className="flex-row space-x-3 mb-4">
        <TouchableOpacity
          onPress={() => setEditing(!editing)}
          className="flex-1 flex-row items-center justify-center space-x-2 p-3 rounded-xl border border-primary"
        >
          <Feather name={editing ? 'x' : 'edit-2'} size={16} color="#0D7377" />
          <Text className="text-primary font-medium">{editing ? 'Cancel Edit' : 'Edit'}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={handleDelete}
          className="flex-1 flex-row items-center justify-center space-x-2 p-3 rounded-xl border border-red-300 bg-red-50"
        >
          <Feather name="trash-2" size={16} color="#EF4444" />
          <Text className="text-overdue font-medium">Delete</Text>
        </TouchableOpacity>
      </View>

      {/* Edit form */}
      {editing && (
        <View className="bg-card p-4 rounded-2xl border border-border mb-4">
          <Text className="text-text-primary font-bold text-lg mb-4">Edit Subscription</Text>

          <Text className="text-text-secondary text-xs mb-1">Name</Text>
          <TextInput
            className="bg-background border border-border rounded-lg p-3 mb-4 text-text-primary"
            value={form.name}
            onChangeText={(t) => setForm({ ...form, name: t })}
            placeholderTextColor="#9CA3AF"
          />

          <Text className="text-text-secondary text-xs mb-1">Cost</Text>
          <TextInput
            className="bg-background border border-border rounded-lg p-3 mb-4 text-text-primary"
            value={form.cost}
            onChangeText={(t) => setForm({ ...form, cost: t })}
            keyboardType="decimal-pad"
            placeholderTextColor="#9CA3AF"
          />

          <ChipSelector label="Currency" options={CURRENCIES} value={form.currency} onChange={(v) => setForm({ ...form, currency: v })} />
          <ChipSelector label="Category" options={CATEGORIES} value={form.category} onChange={(v) => setForm({ ...form, category: v })} />

          <Text className="text-text-secondary text-xs mb-2">Billing Cycle</Text>
          <View className="flex-row space-x-2 mb-4">
            {['monthly', 'yearly'].map((cycle) => (
              <TouchableOpacity
                key={cycle}
                className={`flex-1 p-2.5 rounded-lg border items-center ${form.billingCycle === cycle ? 'bg-primary border-primary' : 'bg-background border-border'}`}
                onPress={() => setForm({ ...form, billingCycle: cycle })}
              >
                <Text className={form.billingCycle === cycle ? 'text-white font-medium text-sm' : 'text-text-primary text-sm capitalize'}>
                  {cycle.charAt(0).toUpperCase() + cycle.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <ChipSelector label="Status" options={STATUSES} value={form.status} onChange={(v) => setForm({ ...form, status: v })} />

          <Text className="text-text-secondary text-xs mb-1">Next Payment (YYYY-MM-DD)</Text>
          <TextInput
            className="bg-background border border-border rounded-lg p-3 mb-4 text-text-primary"
            value={form.nextPayment}
            onChangeText={(t) => setForm({ ...form, nextPayment: t })}
            placeholderTextColor="#9CA3AF"
          />

          <Text className="text-text-secondary text-xs mb-1">Trial Ends On (optional)</Text>
          <TextInput
            className="bg-background border border-border rounded-lg p-3 mb-4 text-text-primary"
            value={form.trialEndsOn}
            onChangeText={(t) => setForm({ ...form, trialEndsOn: t })}
            placeholder="YYYY-MM-DD"
            placeholderTextColor="#9CA3AF"
          />

          <Text className="text-text-secondary text-xs mb-1">Notes (optional)</Text>
          <TextInput
            className="bg-background border border-border rounded-lg p-3 mb-4 text-text-primary"
            value={form.notes}
            onChangeText={(t) => setForm({ ...form, notes: t })}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
            placeholderTextColor="#9CA3AF"
          />

          <Text className="text-text-secondary text-xs mb-2">Worth It Rating</Text>
          <View className="mb-4">
            <StarRating value={form.worthItRating} onChange={(v) => setForm({ ...form, worthItRating: v })} />
          </View>

          <TouchableOpacity
            onPress={handleSave}
            disabled={saving}
            className="bg-primary p-4 rounded-xl items-center"
          >
            {saving ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text className="text-white font-bold text-base">Save Changes</Text>
            )}
          </TouchableOpacity>
        </View>
      )}

      {/* Price History */}
      {priceHistory.length > 0 && (
        <View className="bg-card p-4 rounded-2xl border border-border mb-4">
          <Text className="text-text-primary font-bold mb-3">Price History</Text>
          {priceHistory.map((record) => {
            const old = Number(record.oldCost);
            const nw = Number(record.newCost);
            const increased = nw > old;
            return (
              <View key={record.id} className="flex-row justify-between items-center py-2 border-b border-border last:border-0">
                <View>
                  <View className="flex-row items-center space-x-1">
                    <Feather name={increased ? 'arrow-up' : 'arrow-down'} size={12} color={increased ? '#EF4444' : '#10B981'} />
                    <Text className="font-medium text-sm" style={{ color: increased ? '#EF4444' : '#10B981' }}>
                      {record.currency} {old.toFixed(2)} → {nw.toFixed(2)}
                    </Text>
                  </View>
                  <Text className="text-text-secondary text-xs">
                    {new Date(record.changedAt).toLocaleDateString()}
                  </Text>
                </View>
                <Text className={`text-sm font-bold ${increased ? 'text-overdue' : 'text-green-600'}`}>
                  {increased ? '+' : '-'}{record.currency} {Math.abs(nw - old).toFixed(2)}
                </Text>
              </View>
            );
          })}
        </View>
      )}
    </ScrollView>
  );
}
