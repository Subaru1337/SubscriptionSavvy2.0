import { View, Text, ActivityIndicator, ScrollView, RefreshControl } from 'react-native';
import { useState, useEffect, useCallback } from 'react';
import { api } from '../../lib/api';

export default function DashboardScreen() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);

  const fetchData = useCallback(async () => {
    try {
      const response = await api.get('/analytics/summary');
      setData(response.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading && !data) {
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
      <Text className="text-2xl font-bold text-text-primary mb-6">Overview</Text>

      <View className="bg-card p-6 rounded-2xl shadow-sm border border-border mb-4">
        <Text className="text-text-secondary text-sm font-medium mb-1">Total Monthly Spend</Text>
        <Text className="text-4xl font-bold text-primary">
          {data?.currency} {data?.monthly_total?.toFixed(2) || '0.00'}
        </Text>
      </View>
      
      <View className="bg-card p-6 rounded-2xl shadow-sm border border-border mb-4">
        <Text className="text-text-secondary text-sm font-medium mb-2">Budget Usage</Text>
        <View className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <View 
            className={`h-full ${data?.budget_used_percent > 90 ? 'bg-overdue' : 'bg-primary'}`} 
            style={{ width: `${Math.min(data?.budget_used_percent || 0, 100)}%` }} 
          />
        </View>
        <Text className="text-xs text-text-secondary mt-2 text-right">
          {data?.budget_used_percent?.toFixed(1) || '0.0'}% of Budget
        </Text>
      </View>

      <View className="bg-card p-6 rounded-2xl shadow-sm border border-border mb-4">
        <Text className="text-text-secondary text-sm font-medium mb-1">Annual Projected Spend</Text>
        <Text className="text-2xl font-bold text-text-primary">
          {data?.currency} {data?.annual_total?.toFixed(2) || '0.00'}
        </Text>
      </View>
    </ScrollView>
  );
}
