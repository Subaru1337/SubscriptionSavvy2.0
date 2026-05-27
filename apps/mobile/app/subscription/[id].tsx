import {
  View, Text, ScrollView, TouchableOpacity,
  ActivityIndicator, Alert, RefreshControl, Image
} from 'react-native';
import { useState, useCallback, useEffect } from 'react';
import { useLocalSearchParams, useRouter, Stack } from 'react-router';
import { api } from '../../lib/api';
import { Feather } from '@expo/vector-icons';

type PriceRecord = {
  id: string;
  oldCost: string | number;
  newCost: string | number;
  currency: string;
  changedAt: string;
};

// Assuming payment records are somehow available, otherwise we use price history or mock a bit 
// based on the fact we only have price-history API in the current backend.
// In a real app we'd fetch /payment-history. For now I'll use the price history as the table.

export default function SubscriptionDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [sub, setSub] = useState<any>(null);
  const [priceHistory, setPriceHistory] = useState<PriceRecord[]>([]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/subscriptions?status=all');
      const subs = Array.isArray(res.data) ? res.data : res.data?.subscriptions ?? [];
      const found = subs.find((s: any) => s.id === id);
      if (!found) {
        Alert.alert('Error', 'Subscription not found');
        router.back();
        return;
      }
      setSub(found);

      const histRes = await api.get(`/subscriptions/${id}/price-history`);
      setPriceHistory(histRes.data?.history ?? []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handlePause = async () => {
    const newStatus = sub.status === 'paused' ? 'active' : 'paused';
    try {
      await api.put(`/subscriptions/${id}`, { status: newStatus });
      fetchData();
    } catch (err) {
      Alert.alert('Error', 'Failed to update status');
    }
  };

  const handleCancel = () => {
    Alert.alert(
      'Cancel Subscription',
      `Once cancelled, you will lose access to your benefits at the end of the current billing cycle.`,
      [
        { text: 'Keep', style: 'cancel' },
        {
          text: 'Cancel Now',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.put(`/subscriptions/${id}`, { status: 'cancelled' });
              fetchData();
            } catch {
              Alert.alert('Error', 'Failed to cancel subscription');
            }
          },
        },
      ]
    );
  };

  if (loading || !sub) {
    return (
      <View className="flex-1 justify-center items-center bg-[#F9FAFB]">
        <ActivityIndicator size="large" color="#0D7377" />
      </View>
    );
  }

  const nextPaymentDate = new Date(sub.nextPayment);
  const daysRemaining = Math.ceil((nextPaymentDate.getTime() - new Date().getTime()) / (1000 * 3600 * 24));
  
  return (
    <View className="flex-1 bg-[#F9FAFB]">
      <Stack.Screen 
        options={{
          headerShown: true,
          headerTitle: "SubscriptionSavvy",
          headerTitleAlign: "center",
          headerTitleStyle: { color: "#0D7377", fontWeight: "bold" },
          headerStyle: { backgroundColor: "#F9FAFB" },
          headerShadowVisible: false,
          headerRight: () => (
            <View className="flex-row items-center space-x-3">
              <Feather name="search" size={20} color="#4B5563" />
              <Image 
                source={{ uri: 'https://i.pravatar.cc/150?img=11' }} 
                className="w-8 h-8 rounded-full bg-gray-200"
              />
            </View>
          ),
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()} className="mr-2">
              <Feather name="arrow-left" size={24} color="#0D7377" />
            </TouchableOpacity>
          )
        }} 
      />

      <ScrollView 
        contentContainerStyle={{ padding: 16, paddingBottom: 60 }}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchData} />}
      >
        {/* Main Logo & Header */}
        <View className="items-center mb-6">
          <View className="w-20 h-20 bg-gray-900 rounded-2xl items-center justify-center mb-4 border-2 border-transparent" style={{ borderColor: sub.status === 'active' ? '#10B981' : 'transparent' }}>
             <Text className="text-white text-3xl font-bold uppercase">{sub.name.charAt(0)}</Text>
          </View>
          <View className="bg-[#059669] px-3 py-1 rounded-full mb-3">
            <Text className="text-white text-[10px] font-bold tracking-widest uppercase">
              {sub.category}
            </Text>
          </View>
          <Text className="text-2xl font-bold text-gray-900 mb-1">{sub.name}</Text>
          <Text className="text-sm text-gray-500 capitalize">
            {sub.notes ? `${sub.notes} • ` : ''}{sub.billingCycle} Billing
          </Text>

          {/* Action Buttons */}
          <View className="flex-row space-x-3 mt-5">
            <TouchableOpacity 
              onPress={() => router.push(`/add-subscription?edit=${sub.id}`)}
              className="flex-1 border border-[#0D7377] bg-white py-2.5 rounded-lg items-center"
            >
              <Text className="text-[#0D7377] font-bold text-sm">EDIT</Text>
            </TouchableOpacity>
            {sub.status !== 'cancelled' && (
              <TouchableOpacity 
                onPress={handlePause}
                className="flex-1 bg-[#0D7377] py-2.5 rounded-lg items-center"
              >
                <Text className="text-white font-bold text-sm">
                  {sub.status === 'paused' ? 'RESUME' : 'PAUSE'}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Cost Card */}
        <View className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 mb-4">
          <Text className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">
            Monthly Cost
          </Text>
          <Text className="text-2xl font-bold text-[#0D7377] mb-1">
            {sub.currency} {Number(sub.cost).toFixed(2)}
          </Text>
          <Text className="text-xs text-gray-500">
            Next increase: Not scheduled
          </Text>
        </View>

        {/* Payment Card */}
        <View className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 mb-4">
          <Text className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">
            Next Payment
          </Text>
          <View className="flex-row items-center mb-1">
            <Feather name="calendar" size={16} color="#4B5563" className="mr-2" />
            <Text className="text-base font-bold text-gray-900 ml-2">
              {nextPaymentDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </Text>
          </View>
          <Text className="text-xs text-gray-500">
            {daysRemaining > 0 ? `${daysRemaining} days remaining` : daysRemaining === 0 ? 'Due today' : `${Math.abs(daysRemaining)} days overdue`}
          </Text>
        </View>

        {/* Worth It Rating Card */}
        {sub.worthItRating > 0 && (
          <View className="bg-[#FDE68A] p-5 rounded-2xl shadow-sm mb-4 items-center">
            <Text className="text-[10px] font-bold text-gray-700 uppercase tracking-widest mb-2">
              Worth It Rating
            </Text>
            <Text className="text-4xl font-bold text-gray-900 mb-1">
              {sub.worthItRating.toFixed(1)}
            </Text>
            <View className="flex-row space-x-1 mb-3">
              {[1, 2, 3, 4, 5].map((star) => (
                <Feather 
                  key={star} 
                  name="star" 
                  size={16} 
                  color={star <= sub.worthItRating ? '#000' : 'transparent'} 
                  style={{ opacity: star <= sub.worthItRating ? 1 : 0.3 }}
                />
              ))}
            </View>
            <Text className="text-xs text-gray-800 text-center px-4">
              {sub.worthItRating >= 4 ? 'Great value. Keep this sub.' : 'Consider reviewing this subscription.'}
            </Text>
          </View>
        )}

        {/* Payment History (using Price History as proxy for now) */}
        {priceHistory.length > 0 && (
          <View className="mb-8">
            <Text className="text-base font-bold text-gray-900 mb-3 ml-1">Price History</Text>
            <View className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <View className="flex-row items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-100">
                <Text className="text-[10px] font-bold text-gray-500 flex-1">DATE</Text>
                <Text className="text-[10px] font-bold text-gray-500 flex-1 text-center">CHANGE</Text>
                <Text className="text-[10px] font-bold text-gray-500 flex-1 text-right">STATUS</Text>
              </View>
              {priceHistory.map((record, i) => (
                <View key={record.id} className={`flex-row items-center justify-between px-4 py-4 ${i !== priceHistory.length - 1 ? 'border-b border-gray-100' : ''}`}>
                  <Text className="text-xs text-gray-700 flex-1">
                    {new Date(record.changedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </Text>
                  <Text className="text-sm font-medium text-gray-900 flex-1 text-center">
                    {record.currency} {Number(record.oldCost).toFixed(2)} → {Number(record.newCost).toFixed(2)}
                  </Text>
                  <View className="flex-1 items-end">
                    <View className="bg-[#059669] px-2 py-0.5 rounded flex-row items-center">
                      <Text className="text-[9px] font-bold text-white uppercase">UPDATED</Text>
                    </View>
                  </View>
                </View>
              ))}
              <TouchableOpacity className="py-4 border-t border-gray-100 items-center justify-center">
                <Text className="text-[10px] font-bold text-[#0D7377] uppercase tracking-widest">View All Records</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Danger Zone */}
        {sub.status !== 'cancelled' && (
          <View className="mb-4">
            <Text className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2 ml-1">
              Danger Zone
            </Text>
            <View className="bg-[#FEF2F2] p-5 rounded-2xl border border-[#FECACA]">
              <Text className="text-base font-bold text-[#DC2626] mb-2">Cancel Subscription</Text>
              <Text className="text-sm text-gray-700 mb-4">
                Once cancelled, you will lose access to your benefits at the end of the current billing cycle.
              </Text>
              <TouchableOpacity 
                onPress={handleCancel}
                className="bg-[#EF4444] py-3 rounded-lg items-center"
              >
                <Text className="text-white font-bold text-sm">CANCEL NOW</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}
