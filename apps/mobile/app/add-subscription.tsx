import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  Alert, ActivityIndicator, KeyboardAvoidingView, Platform, StyleSheet
} from 'react-native';
import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { api } from '../lib/api';
import {
  buildSubscriptionPayload,
  subscriptionToFormState,
} from '../lib/subscription-payload';
import {
  getPushPermissionGranted,
  schedulePaymentReminder,
} from '../lib/push-notifications';
import BottomSheet, { BottomSheetScrollView, BottomSheetBackdrop } from '@gorhom/bottom-sheet';
import { Feather } from '@expo/vector-icons';

const CATEGORIES = ['Entertainment', 'Productivity', 'Health', 'Education', 'Finance', 'Shopping', 'Developer Tools', 'Other'];
const CURRENCIES = ['USD', 'INR', 'EUR', 'GBP', 'AED', 'SGD', 'AUD', 'CAD'];
const STATUSES = ['active', 'paused', 'cancelled'];

function ChipSelector({ label, options, value, onChange }: {
  label: string; options: string[]; value: string; onChange: (v: string) => void;
}) {
  return (
    <View className="mb-5">
      <Text className="text-[#111827] font-bold mb-3 text-sm" style={{ fontFamily: 'PlusJakartaSans_700Bold' }}>{label}</Text>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false} 
        contentContainerStyle={{ flexDirection: 'row', paddingHorizontal: 4 }}
      >
        {options.map((opt, i) => (
          <TouchableOpacity
            key={opt}
            onPress={() => onChange(opt)}
            style={{ marginRight: i < options.length - 1 ? 8 : 0 }}
            className={`px-4 py-2.5 rounded-full border ${value === opt ? 'bg-[#0D9E75] border-[#0D9E75]' : 'bg-white border-gray-200'}`}
          >
            <Text className={value === opt ? 'text-white font-bold text-xs uppercase tracking-wider' : 'text-[#6B7280] font-bold text-xs uppercase tracking-wider'} style={{ fontFamily: 'PlusJakartaSans_700Bold' }}>
              {opt}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

function StarRating({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <View className="flex-row space-x-2">
      {[1, 2, 3, 4, 5].map((star) => (
        <TouchableOpacity key={star} onPress={() => onChange(star)}>
          <Text className={`text-3xl ${star <= value ? 'text-[#F59E0B]' : 'text-gray-200'}`}>★</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

export default function AddSubscriptionScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const rawId = params.id ?? params.edit;
  const id = Array.isArray(rawId) ? rawId[0] : rawId;
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(!!id);
  const bottomSheetRef = useRef<BottomSheet>(null);

  const snapPoints = useMemo(() => ['90%'], []);

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
    if (!id) return;

    setFetching(true);
    api.get(`/subscriptions/${id}`)
      .then((res) => {
        const sub = res.data?.subscription;
        if (sub) {
          setForm(subscriptionToFormState(sub));
        } else {
          Alert.alert('Error', 'Subscription not found');
          router.back();
        }
      })
      .catch(() => Alert.alert('Error', 'Failed to load subscription details'))
      .finally(() => setFetching(false));
  }, [id]);

  const handleSubmit = async () => {
    if (!form.name || !form.cost) {
      Alert.alert('Error', 'Please fill in Name and Cost');
      return;
    }

    let payload;
    try {
      payload = buildSubscriptionPayload(form);
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Please check your input');
      return;
    }

    setLoading(true);
    try {
      if (id) {
        await api.put(`/subscriptions/${id}`, payload);
      } else {
        await api.post('/subscriptions', payload);
      }

      if (payload.status === 'active' && (await getPushPermissionGranted())) {
        await schedulePaymentReminder(
          payload.name,
          form.nextPayment,
          `${payload.currency} ${payload.cost}`,
        );
      }

      bottomSheetRef.current?.close();
    } catch (error: any) {
      if (error?.response?.status === 409 && error?.response?.data?.existing) {
        const ext = error.response.data.existing;
        Alert.alert('Duplicate Found', `You already have a subscription to ${ext.name} (${ext.currency}${ext.cost}). Please use a different name or edit the existing one.`);
      } else {
        const msg = error?.response?.data?.error || 'Failed to save subscription';
        Alert.alert('Error', msg);
      }
      setLoading(false);
    }
  };

  const renderBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        opacity={0.6}
        onPress={() => router.back()}
      />
    ),
    []
  );

  return (
    <View style={styles.container}>
      <BottomSheet
        ref={bottomSheetRef}
        index={0}
        snapPoints={snapPoints}
        enablePanDownToClose
        onClose={() => router.back()}
        backdropComponent={renderBackdrop}
        backgroundStyle={{ backgroundColor: '#F4F6F9', borderRadius: 24 }}
        handleIndicatorStyle={{ backgroundColor: '#D1D5DB', width: 40 }}
      >
        {fetching ? (
          <View className="flex-1 justify-center items-center">
            <ActivityIndicator size="large" color="#0D9E75" />
          </View>
        ) : (
          <KeyboardAvoidingView 
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={{ flex: 1 }}
          >
            <BottomSheetScrollView contentContainerStyle={{ padding: 24 }}>
              <View className="flex-row justify-between items-center mb-6">
                <Text className="text-2xl font-bold text-[#111827]" style={{ fontFamily: 'PlusJakartaSans_700Bold' }}>
                  {id ? 'Edit Subscription' : 'Add Subscription'}
                </Text>
                <TouchableOpacity onPress={() => bottomSheetRef.current?.close()} className="w-8 h-8 bg-gray-200 rounded-full items-center justify-center">
                  <Feather name="x" size={16} color="#4B5563" />
                </TouchableOpacity>
              </View>

              <View className="bg-white p-5 rounded-[24px] shadow-sm border border-gray-100 mb-6">
                <Text className="text-[#111827] font-bold mb-2 text-sm" style={{ fontFamily: 'PlusJakartaSans_700Bold' }}>Service Name <Text className="text-[#EF4444]">*</Text></Text>
                <TextInput
                  className="bg-[#F4F6F9] rounded-xl p-4 mb-5 text-[15px] text-[#111827]"
                  style={{ fontFamily: 'PlusJakartaSans_500Medium' }}
                  placeholder="Netflix, Spotify..."
                  placeholderTextColor="#9CA3AF"
                  value={form.name}
                  onChangeText={(t) => setForm({ ...form, name: t })}
                />

                <Text className="text-[#111827] font-bold mb-2 text-sm" style={{ fontFamily: 'PlusJakartaSans_700Bold' }}>Cost <Text className="text-[#EF4444]">*</Text></Text>
                <TextInput
                  className="bg-[#F4F6F9] rounded-xl p-4 mb-5 text-[15px] text-[#111827]"
                  style={{ fontFamily: 'PlusJakartaSans_500Medium' }}
                  placeholder="15.99"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="decimal-pad"
                  value={form.cost}
                  onChangeText={(t) => setForm({ ...form, cost: t })}
                />

                <ChipSelector label="Currency" options={CURRENCIES} value={form.currency} onChange={(v) => setForm({ ...form, currency: v })} />
                <ChipSelector label="Category" options={CATEGORIES} value={form.category} onChange={(v) => setForm({ ...form, category: v })} />

                <Text className="text-[#111827] font-bold mb-3 text-sm" style={{ fontFamily: 'PlusJakartaSans_700Bold' }}>Billing Cycle</Text>
                <View className="flex-row space-x-3 mb-5">
                  {['monthly', 'yearly'].map((cycle) => (
                    <TouchableOpacity
                      key={cycle}
                      className={`flex-1 p-4 rounded-xl items-center border ${form.billingCycle === cycle ? 'bg-[#0D9E75] border-[#0D9E75]' : 'bg-white border-gray-200'}`}
                      onPress={() => setForm({ ...form, billingCycle: cycle as 'monthly' | 'yearly' })}
                    >
                      <Text className={form.billingCycle === cycle ? 'text-white font-bold uppercase tracking-widest text-xs' : 'text-[#6B7280] font-bold uppercase tracking-widest text-xs'} style={{ fontFamily: 'PlusJakartaSans_700Bold' }}>
                        {cycle}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <ChipSelector label="Status" options={STATUSES} value={form.status} onChange={(v) => setForm({ ...form, status: v })} />

                <Text className="text-[#111827] font-bold mb-2 text-sm" style={{ fontFamily: 'PlusJakartaSans_700Bold' }}>Next Payment Date (YYYY-MM-DD) <Text className="text-[#EF4444]">*</Text></Text>
                <TextInput
                  className="bg-[#F4F6F9] rounded-xl p-4 mb-5 text-[15px] text-[#111827]"
                  style={{ fontFamily: 'PlusJakartaSans_500Medium' }}
                  value={form.nextPayment}
                  placeholderTextColor="#9CA3AF"
                  onChangeText={(t) => setForm({ ...form, nextPayment: t })}
                />

                <Text className="text-[#111827] font-bold mb-2 text-sm" style={{ fontFamily: 'PlusJakartaSans_700Bold' }}>Trial Ends On (Optional)</Text>
                <TextInput
                  className="bg-[#F4F6F9] rounded-xl p-4 mb-5 text-[15px] text-[#111827]"
                  style={{ fontFamily: 'PlusJakartaSans_500Medium' }}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor="#9CA3AF"
                  value={form.trialEndsOn}
                  onChangeText={(t) => setForm({ ...form, trialEndsOn: t })}
                />

                <Text className="text-[#111827] font-bold mb-2 text-sm" style={{ fontFamily: 'PlusJakartaSans_700Bold' }}>Notes</Text>
                <TextInput
                  className="bg-[#F4F6F9] rounded-xl p-4 mb-5 text-[15px] text-[#111827]"
                  style={{ fontFamily: 'PlusJakartaSans_500Medium' }}
                  placeholder="Any notes..."
                  placeholderTextColor="#9CA3AF"
                  value={form.notes}
                  onChangeText={(t) => setForm({ ...form, notes: t })}
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                />

                <Text className="text-[#111827] font-bold mb-3 text-sm" style={{ fontFamily: 'PlusJakartaSans_700Bold' }}>Worth It Rating</Text>
                <View className="mb-2 items-center bg-[#F4F6F9] p-4 rounded-xl">
                  <StarRating value={form.worthItRating} onChange={(v) => setForm({ ...form, worthItRating: v })} />
                  <Text className="text-[#6B7280] font-bold text-[10px] mt-2 uppercase tracking-widest" style={{ fontFamily: 'PlusJakartaSans_700Bold' }}>
                    {form.worthItRating === 0 ? 'Not rated' : ['', 'Poor', 'Fair', 'Good', 'Great', 'Excellent'][form.worthItRating]}
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                className="bg-[#0D9E75] p-5 rounded-2xl items-center shadow-sm mb-12"
                onPress={handleSubmit}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text className="text-white font-bold text-[15px]" style={{ fontFamily: 'PlusJakartaSans_700Bold' }}>{id ? 'Save Changes' : 'Save Subscription'}</Text>
                )}
              </TouchableOpacity>
            </BottomSheetScrollView>
          </KeyboardAvoidingView>
        )}
      </BottomSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0)',
  },
});
