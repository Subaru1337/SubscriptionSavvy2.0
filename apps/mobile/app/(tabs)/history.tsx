import {
  View, Text, ScrollView, ActivityIndicator, RefreshControl,
  TouchableOpacity, Alert
} from 'react-native';
import { useState, useEffect, useCallback } from 'react';
import { api } from '../../lib/api';
import { Feather } from '@expo/vector-icons';

type PaymentRecord = {
  id: string;
  amount: string | number;
  currency: string;
  paidAt: string;
  subscription?: { name: string };
  subscriptionId: string;
};

type PriceRecord = {
  id: string;
  oldCost: string | number;
  newCost: string | number;
  currency: string;
  changedAt: string;
  subscription?: { name: string };
  subscriptionId: string;
};

type SubscriptionBasic = {
  id: string;
  name: string;
};

export default function HistoryScreen() {
  const [loading, setLoading] = useState(true);
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [priceChanges, setPriceChanges] = useState<PriceRecord[]>([]);
  const [subscriptions, setSubscriptions] = useState<SubscriptionBasic[]>([]);
  const [activeTab, setActiveTab] = useState<'payments' | 'prices'>('payments');

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      // First get all subscriptions to pull per-sub history
      const subsRes = await api.get('/subscriptions?status=all');
      const subs: SubscriptionBasic[] = Array.isArray(subsRes.data)
        ? subsRes.data
        : subsRes.data?.subscriptions ?? [];
      setSubscriptions(subs);

      // Fetch price history for all subs in parallel
      const priceResults = await Promise.allSettled(
        subs.map((s) =>
          api.get(`/subscriptions/${s.id}/price-history`).then((r) => ({
            sub: s,
            history: r.data?.history ?? [],
          }))
        )
      );

      const allPriceChanges: PriceRecord[] = [];
      for (const result of priceResults) {
        if (result.status === 'fulfilled') {
          const { sub, history } = result.value;
          for (const h of history) {
            allPriceChanges.push({ ...h, subscription: { name: sub.name } });
          }
        }
      }
      allPriceChanges.sort(
        (a, b) => new Date(b.changedAt).getTime() - new Date(a.changedAt).getTime()
      );
      setPriceChanges(allPriceChanges);

      // Fetch payment history via analytics/trends — but we use the subscriptions list
      // For full payment records, we need individual sub pay endpoints
      // The API doesn't have a global payment history endpoint, so we use the extended analytics
      const extRes = await api.get('/analytics/extended').catch(() => null);
      if (extRes?.data?.annualRecap) {
        // We have the recap but not raw records. Use trends for monthly buckets.
      }

      // Use trends as a summary (monthly totals) since no global payment list endpoint
      const trendsRes = await api.get('/analytics/trends').catch(() => ({ data: { trends: [] } }));
      setPayments(trendsRes.data?.trends ?? []);

    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading && payments.length === 0 && priceChanges.length === 0) {
    return (
      <View className="flex-1 justify-center items-center bg-background">
        <ActivityIndicator size="large" color="#0D7377" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background">
      {/* Tab switcher */}
      <View className="flex-row bg-white border-b border-border">
        {[
          { key: 'payments', label: 'Monthly Spend', icon: 'dollar-sign' },
          { key: 'prices', label: 'Price Changes', icon: 'trending-up' },
        ].map(({ key, label, icon }) => (
          <TouchableOpacity
            key={key}
            onPress={() => setActiveTab(key as 'payments' | 'prices')}
            className="flex-1 py-3 items-center"
          >
            <View className="flex-row items-center space-x-1">
              <Feather
                name={icon as any}
                size={14}
                color={activeTab === key ? '#0D7377' : '#6B6560'}
              />
              <Text
                className={`text-sm font-medium ${activeTab === key ? 'text-primary' : 'text-text-secondary'}`}
              >
                {label}
              </Text>
            </View>
            {activeTab === key && (
              <View className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
            )}
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        className="flex-1 p-4"
        refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchData} />}
      >
        {activeTab === 'payments' ? (
          <>
            <Text className="text-2xl font-bold text-text-primary mb-4">Monthly Spending</Text>
            <Text className="text-text-secondary text-sm mb-4">
              Last 6 months of payment totals
            </Text>

            {(payments as any[]).length === 0 ? (
              <View className="items-center justify-center mt-20">
                <Feather name="dollar-sign" size={48} color="#9CA3AF" />
                <Text className="text-text-secondary mt-4">No payment history yet</Text>
              </View>
            ) : (
              (payments as any[]).map((month: any, index: number) => {
                const maxTotal = Math.max(...(payments as any[]).map((m: any) => m.total || 0), 1);
                const barWidth = ((month.total || 0) / maxTotal) * 100;
                return (
                  <View key={index} className="bg-card p-4 rounded-xl border border-border mb-3">
                    <View className="flex-row justify-between items-center mb-2">
                      <Text className="text-text-primary font-medium">
                        {month.label || month.month}
                      </Text>
                      <Text className="text-primary font-bold">
                        {Number(month.total || 0).toFixed(2)}
                      </Text>
                    </View>
                    <View className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <View
                        className="h-full bg-primary rounded-full"
                        style={{ width: `${barWidth}%` }}
                      />
                    </View>
                  </View>
                );
              })
            )}
          </>
        ) : (
          <>
            <Text className="text-2xl font-bold text-text-primary mb-4">Price Changes</Text>
            <Text className="text-text-secondary text-sm mb-4">
              History of subscription price updates
            </Text>

            {priceChanges.length === 0 ? (
              <View className="items-center justify-center mt-20">
                <Feather name="trending-up" size={48} color="#9CA3AF" />
                <Text className="text-text-secondary mt-4">No price changes recorded yet</Text>
                <Text className="text-text-secondary text-xs mt-1 text-center px-8">
                  Price changes are tracked automatically when you edit a subscription's cost
                </Text>
              </View>
            ) : (
              priceChanges.map((record) => {
                const oldCost = Number(record.oldCost);
                const newCost = Number(record.newCost);
                const increased = newCost > oldCost;
                const diff = Math.abs(newCost - oldCost);
                return (
                  <View
                    key={record.id}
                    className="bg-card p-4 rounded-xl border border-border mb-3"
                  >
                    <View className="flex-row justify-between items-start">
                      <View className="flex-1">
                        <Text className="text-text-primary font-bold">
                          {record.subscription?.name ?? 'Unknown'}
                        </Text>
                        <Text className="text-text-secondary text-xs mt-0.5">
                          {new Date(record.changedAt).toLocaleDateString(undefined, {
                            year: 'numeric', month: 'short', day: 'numeric',
                          })}
                        </Text>
                      </View>
                      <View className="items-end">
                        <View className="flex-row items-center space-x-1">
                          <Feather
                            name={increased ? 'arrow-up' : 'arrow-down'}
                            size={14}
                            color={increased ? '#EF4444' : '#10B981'}
                          />
                          <Text
                            className="font-bold text-sm"
                            style={{ color: increased ? '#EF4444' : '#10B981' }}
                          >
                            {record.currency} {diff.toFixed(2)}
                          </Text>
                        </View>
                        <Text className="text-text-secondary text-xs">
                          {record.currency} {oldCost.toFixed(2)} → {newCost.toFixed(2)}
                        </Text>
                      </View>
                    </View>
                  </View>
                );
              })
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}
