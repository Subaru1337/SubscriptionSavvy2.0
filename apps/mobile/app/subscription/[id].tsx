import {
  View, Text, TouchableOpacity,
  ActivityIndicator, Alert, RefreshControl, Dimensions, StyleSheet
} from 'react-native';
import { useState, useCallback, useEffect } from 'react';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { api } from '../../lib/api';
import { Feather } from '@expo/vector-icons';
import Animated, { 
  useAnimatedScrollHandler, 
  useSharedValue, 
  useAnimatedStyle,
  interpolate,
  Extrapolation
} from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import SubscriptionLogo from '../../components/SubscriptionLogo';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const HEADER_HEIGHT = 280;

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
  const [paying, setPaying] = useState(false);
  const [sub, setSub] = useState<any>(null);
  const [priceHistory, setPriceHistory] = useState<PriceRecord[]>([]);

  const scrollY = useSharedValue(0);

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    },
  });

  const headerAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          translateY: interpolate(
            scrollY.value,
            [-HEADER_HEIGHT, 0, HEADER_HEIGHT],
            [-HEADER_HEIGHT / 2, 0, HEADER_HEIGHT * 0.75],
            Extrapolation.CLAMP
          )
        },
        {
          scale: interpolate(
            scrollY.value,
            [-HEADER_HEIGHT, 0],
            [2, 1],
            Extrapolation.CLAMP
          )
        }
      ]
    };
  });

  const navBarAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: interpolate(
        scrollY.value,
        [HEADER_HEIGHT - 120, HEADER_HEIGHT - 80],
        [0, 1],
        Extrapolation.CLAMP
      )
    };
  });

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

  const handleDelete = () => {
    Alert.alert(
      'Delete Subscription',
      'Are you sure you want to permanently delete this subscription? This cannot be undone.',
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

  const handleMarkAsPaid = async () => {
    setPaying(true);
    try {
      await api.post(`/subscriptions/${id}/pay`);
      fetchData();
    } catch (err: any) {
      const msg = err.response?.data?.error || 'Failed to mark as paid';
      Alert.alert('Error', msg);
    } finally {
      setPaying(false);
    }
  };

  if (loading || !sub) {
    return (
      <View className="flex-1 justify-center items-center bg-[#F4F6F9]">
        <ActivityIndicator size="large" color="#0D9E75" />
      </View>
    );
  }

  const nextPaymentDate = new Date(sub.nextPayment);
  const daysRemaining = Math.ceil((nextPaymentDate.getTime() - new Date().getTime()) / (1000 * 3600 * 24));
  
  return (
    <View className="flex-1 bg-[#F4F6F9]">
      <Stack.Screen options={{ headerShown: false }} />

      {/* Floating Header */}
      <View className="absolute top-0 w-full z-50 pt-12 pb-4 px-6 flex-row justify-between items-center">
        <TouchableOpacity 
          onPress={() => router.back()} 
          className="w-10 h-10 bg-white/80 rounded-full items-center justify-center backdrop-blur-md"
        >
          <Feather name="arrow-left" size={20} color="#111827" />
        </TouchableOpacity>
        
        <Animated.View style={navBarAnimatedStyle}>
          <Text className="text-lg font-bold text-[#111827]" style={{ fontFamily: 'PlusJakartaSans_700Bold' }}>
            {sub.name}
          </Text>
        </Animated.View>

        <TouchableOpacity 
          onPress={() => router.push(`/add-subscription?edit=${sub.id}`)}
          className="w-10 h-10 bg-white/80 rounded-full items-center justify-center backdrop-blur-md"
        >
          <Feather name="edit-2" size={18} color="#111827" />
        </TouchableOpacity>
      </View>

      <Animated.ScrollView 
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        contentContainerStyle={{ paddingBottom: 100 }}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchData} tintColor="#0D9E75" progressViewOffset={HEADER_HEIGHT} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Parallax Header Area */}
        <View className="items-center justify-center w-full" style={{ height: HEADER_HEIGHT }}>
          <Animated.View style={[headerAnimatedStyle, { alignItems: 'center', justifyContent: 'center' }]}>
            <View className="w-28 h-28 bg-white rounded-[32px] items-center justify-center mb-6 shadow-sm border border-gray-100 overflow-hidden relative">
              <SubscriptionLogo name={sub.name} size={112} />
              {sub.status === 'paused' && (
                <View className="absolute inset-0 bg-white/60 items-center justify-center">
                  <Feather name="pause-circle" size={40} color="#F59E0B" />
                </View>
              )}
            </View>
            <View className="bg-[#1DCCA0]/20 px-4 py-1.5 rounded-full mb-4 border border-[#1DCCA0]/30">
              <Text className="text-[#0D9E75] text-[10px] font-bold tracking-widest uppercase" style={{ fontFamily: 'PlusJakartaSans_700Bold' }}>
                {sub.category}
              </Text>
            </View>
            <Text className="text-3xl font-bold text-[#111827] mb-2" style={{ fontFamily: 'PlusJakartaSans_700Bold' }}>{sub.name}</Text>
            <Text className="text-[13px] text-[#6B7280] uppercase tracking-wider" style={{ fontFamily: 'PlusJakartaSans_700Bold' }}>
              {sub.notes ? `${sub.notes} • ` : ''}{sub.billingCycle}
            </Text>
          </Animated.View>
        </View>

        <View className="px-6 -mt-6">
          {/* Action Buttons */}
          <View className="flex-row space-x-4 mb-8">
            <TouchableOpacity 
              onPress={() => router.push(`/add-subscription?edit=${sub.id}`)}
              className="flex-1 border border-gray-200 bg-white py-4 rounded-2xl items-center shadow-sm"
            >
              <Text className="text-[#111827] font-bold text-[13px]" style={{ fontFamily: 'PlusJakartaSans_700Bold' }}>Edit Details</Text>
            </TouchableOpacity>
            {sub.status !== 'cancelled' && (
              <TouchableOpacity 
                onPress={handlePause}
                className={`flex-1 py-4 rounded-2xl items-center shadow-sm ${sub.status === 'paused' ? 'bg-[#0D9E75]' : 'bg-[#FEE2E2]'}`}
              >
                <Text className={`font-bold text-[13px] ${sub.status === 'paused' ? 'text-white' : 'text-[#DC2626]'}`} style={{ fontFamily: 'PlusJakartaSans_700Bold' }}>
                  {sub.status === 'paused' ? 'Resume Sub' : 'Pause Sub'}
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Cost Card */}
          <View className="bg-white p-6 rounded-[24px] shadow-sm border border-gray-100 mb-4 flex-row items-center justify-between">
            <View>
              <Text className="text-[10px] font-bold text-[#6B7280] uppercase tracking-widest mb-2" style={{ fontFamily: 'PlusJakartaSans_700Bold' }}>
                Monthly Cost
              </Text>
              <Text className="text-3xl font-bold text-[#0D9E75]" style={{ fontFamily: 'PlusJakartaSans_700Bold' }}>
                ₹{Number(sub.cost).toFixed(0)}
              </Text>
            </View>
            <View className="bg-[#F4F6F9] w-14 h-14 rounded-full items-center justify-center">
              <Feather name="credit-card" size={24} color="#0D9E75" />
            </View>
          </View>

          {/* Payment Card */}
          <View className="bg-white p-6 rounded-[24px] shadow-sm border border-gray-100 mb-4">
            <Text className="text-[10px] font-bold text-[#6B7280] uppercase tracking-widest mb-4" style={{ fontFamily: 'PlusJakartaSans_700Bold' }}>
              Next Payment
            </Text>
            <View className="flex-row items-center justify-between mb-3">
              <View className="flex-row items-center">
                <View className="w-10 h-10 bg-[#F4F6F9] rounded-full items-center justify-center mr-4">
                  <Feather name="calendar" size={18} color="#4B5563" />
                </View>
                <View>
                  <Text className="text-lg font-bold text-[#111827]" style={{ fontFamily: 'PlusJakartaSans_700Bold' }}>
                    {nextPaymentDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </Text>
                  <Text className={`text-[11px] font-bold uppercase tracking-wider mt-1 ${daysRemaining <= 7 && daysRemaining > 0 ? 'text-[#F59E0B]' : daysRemaining <= 0 ? 'text-[#EF4444]' : 'text-[#10B981]'}`} style={{ fontFamily: 'PlusJakartaSans_700Bold' }}>
                    {daysRemaining > 0 ? `In ${daysRemaining} Days` : daysRemaining === 0 ? 'Due Today' : `${Math.abs(daysRemaining)} Days Overdue`}
                  </Text>
                </View>
              </View>
            </View>
            
            {daysRemaining <= 0 && sub.status === 'active' && (
              <TouchableOpacity 
                onPress={handleMarkAsPaid}
                disabled={paying}
                className="bg-[#0D9E75] p-4 rounded-xl items-center mt-2 shadow-sm"
              >
                {paying ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <Text className="text-white text-[13px] font-bold uppercase tracking-widest" style={{ fontFamily: 'PlusJakartaSans_700Bold' }}>Mark As Paid</Text>
                )}
              </TouchableOpacity>
            )}
          </View>

          {/* Worth It Rating Card */}
          {sub.worthItRating > 0 && (
            <View className="bg-[#FEF3C7] p-6 rounded-[24px] shadow-sm mb-4 items-center border border-[#FDE68A]">
              <Text className="text-[10px] font-bold text-[#B45309] uppercase tracking-widest mb-3" style={{ fontFamily: 'PlusJakartaSans_700Bold' }}>
                Worth It Rating
              </Text>
              <Text className="text-5xl font-bold text-[#92400E] mb-3" style={{ fontFamily: 'PlusJakartaSans_700Bold' }}>
                {sub.worthItRating.toFixed(1)}
              </Text>
              <View className="flex-row space-x-2 mb-4">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Feather 
                    key={star} 
                    name="star" 
                    size={20} 
                    color={star <= sub.worthItRating ? '#F59E0B' : 'transparent'} 
                    style={{ opacity: star <= sub.worthItRating ? 1 : 0.3 }}
                  />
                ))}
              </View>
              <Text className="text-[13px] text-[#92400E]" style={{ fontFamily: 'PlusJakartaSans_500Medium' }}>
                {sub.worthItRating >= 4 ? 'Great value! Definitely keep this.' : 'Consider reviewing this subscription.'}
              </Text>
            </View>
          )}

          {/* Payment History (using Price History as proxy for now) */}
          {priceHistory.length > 0 && (
            <View className="mb-8 mt-4">
              <Text className="text-sm font-bold text-[#111827] mb-4 ml-2" style={{ fontFamily: 'PlusJakartaSans_700Bold' }}>Price History</Text>
              <View className="bg-white rounded-[24px] shadow-sm border border-gray-100 overflow-hidden">
                <View className="flex-row items-center justify-between px-6 py-4 bg-[#F4F6F9] border-b border-gray-100">
                  <Text className="text-[10px] font-bold text-[#6B7280] flex-1 tracking-widest" style={{ fontFamily: 'PlusJakartaSans_700Bold' }}>DATE</Text>
                  <Text className="text-[10px] font-bold text-[#6B7280] flex-1 text-center tracking-widest" style={{ fontFamily: 'PlusJakartaSans_700Bold' }}>CHANGE</Text>
                  <Text className="text-[10px] font-bold text-[#6B7280] flex-1 text-right tracking-widest" style={{ fontFamily: 'PlusJakartaSans_700Bold' }}>STATUS</Text>
                </View>
                {priceHistory.map((record, i) => (
                  <View key={record.id} className={`flex-row items-center justify-between px-6 py-5 ${i !== priceHistory.length - 1 ? 'border-b border-gray-100' : ''}`}>
                    <Text className="text-[13px] text-[#4B5563] flex-1" style={{ fontFamily: 'PlusJakartaSans_500Medium' }}>
                      {new Date(record.changedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </Text>
                    <Text className="text-[14px] font-bold text-[#111827] flex-1 text-center" style={{ fontFamily: 'PlusJakartaSans_700Bold' }}>
                      ₹{Number(record.oldCost).toFixed(0)} → ₹{Number(record.newCost).toFixed(0)}
                    </Text>
                    <View className="flex-1 items-end">
                      <View className="bg-[#E0F2FE] px-2 py-1 rounded-[6px]">
                        <Text className="text-[9px] font-bold text-[#0369A1] uppercase tracking-widest" style={{ fontFamily: 'PlusJakartaSans_700Bold' }}>UPDATED</Text>
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Danger Zone */}
          <View className="mb-4 mt-4">
            <Text className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4 ml-2" style={{ fontFamily: 'PlusJakartaSans_700Bold' }}>
              Danger Zone
            </Text>
            {sub.status !== 'cancelled' ? (
              <View className="bg-white p-6 rounded-[24px] border border-[#FEE2E2] shadow-sm">
                <Text className="text-base font-bold text-[#DC2626] mb-2" style={{ fontFamily: 'PlusJakartaSans_700Bold' }}>Cancel Subscription</Text>
                <Text className="text-[13px] text-[#6B7280] mb-6 leading-5" style={{ fontFamily: 'PlusJakartaSans_500Medium' }}>
                  Once cancelled, you will lose access to your benefits at the end of the current billing cycle.
                </Text>
                <TouchableOpacity 
                  onPress={handleCancel}
                  className="bg-[#FEF2F2] py-4 rounded-xl items-center border border-[#FECACA]"
                >
                  <Text className="text-[#DC2626] font-bold text-[13px] uppercase tracking-widest" style={{ fontFamily: 'PlusJakartaSans_700Bold' }}>Cancel Now</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View className="bg-white p-6 rounded-[24px] border border-[#FEE2E2] shadow-sm">
                <Text className="text-base font-bold text-[#DC2626] mb-2" style={{ fontFamily: 'PlusJakartaSans_700Bold' }}>Delete Subscription</Text>
                <Text className="text-[13px] text-[#6B7280] mb-6 leading-5" style={{ fontFamily: 'PlusJakartaSans_500Medium' }}>
                  This subscription is currently cancelled. Deleting it will remove it permanently from your history and analytics.
                </Text>
                <TouchableOpacity 
                  onPress={handleDelete}
                  className="bg-[#DC2626] py-4 rounded-xl items-center shadow-sm"
                >
                  <Text className="text-white font-bold text-[13px] uppercase tracking-widest" style={{ fontFamily: 'PlusJakartaSans_700Bold' }}>Permanently Delete</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </Animated.ScrollView>
    </View>
  );
}
