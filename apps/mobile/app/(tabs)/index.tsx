import { View, Text, ActivityIndicator, ScrollView, RefreshControl, Dimensions } from 'react-native';
import { useState, useEffect, useCallback } from 'react';
import { api } from '../../lib/api';
import { PieChart } from 'react-native-chart-kit';

const screenWidth = Dimensions.get("window").width;

export default function DashboardScreen() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [subscriptions, setSubscriptions] = useState<any[]>([]);

  const fetchData = useCallback(async () => {
    try {
      const [summaryRes, subsRes] = await Promise.all([
        api.get('/analytics/summary'),
        api.get('/subscriptions')
      ]);
      setData(summaryRes.data);
      // API may return an array directly or { subscriptions: [...] }
      const subs = Array.isArray(subsRes.data)
        ? subsRes.data
        : subsRes.data?.subscriptions ?? [];
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

  if (loading && !data) {
    return (
      <View className="flex-1 justify-center items-center bg-background">
        <ActivityIndicator size="large" color="#0D7377" />
      </View>
    );
  }

  // Calculate category breakdown for the pie chart
  const safeSubs = Array.isArray(subscriptions) ? subscriptions : [];
  const categoryTotals = safeSubs.reduce((acc, sub) => {
    const cost = parseFloat(sub.cost);
    acc[sub.category] = (acc[sub.category] || 0) + cost;
    return acc;
  }, {} as Record<string, number>);

  const chartColors = ['#0D7377', '#14B8A6', '#F59E0B', '#EF4444', '#8B5CF6', '#3B82F6', '#EC4899'];
  const chartData = Object.keys(categoryTotals).map((category, index) => ({
    name: category,
    total: categoryTotals[category],
    color: chartColors[index % chartColors.length],
    legendFontColor: "#1A1A1A",
    legendFontSize: 12
  }));

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

      {chartData.length > 0 && (
        <View className="bg-card p-4 rounded-2xl shadow-sm border border-border mb-4 items-center">
          <Text className="text-text-secondary text-sm font-medium mb-2 w-full text-left">Spending by Category</Text>
          <PieChart
            data={chartData}
            width={screenWidth - 64}
            height={200}
            chartConfig={{
              color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
            }}
            accessor={"total"}
            backgroundColor={"transparent"}
            paddingLeft={"15"}
            center={[10, 0]}
            absolute
          />
        </View>
      )}

      <View className="bg-card p-6 rounded-2xl shadow-sm border border-border mb-8">
        <Text className="text-text-secondary text-sm font-medium mb-1">Annual Projected Spend</Text>
        <Text className="text-2xl font-bold text-text-primary">
          {data?.currency} {data?.annual_total?.toFixed(2) || '0.00'}
        </Text>
      </View>
    </ScrollView>
  );
}
