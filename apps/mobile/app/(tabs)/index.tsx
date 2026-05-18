import { View, Text, ScrollView, SafeAreaView } from "react-native";
import { LayoutDashboard } from "lucide-react-native";

export default function DashboardScreen() {
  return (
    <SafeAreaView className="flex-1 bg-base">
      <ScrollView contentContainerClassName="p-6">
        <View className="flex-row items-center gap-3 mb-6">
          <View className="w-10 h-10 rounded-xl bg-amber/15 items-center justify-center border border-amber/30">
            <LayoutDashboard size={20} color="#0D7377" />
          </View>
          <Text className="text-3xl font-bold text-text">Dashboard</Text>
        </View>

        <View className="bg-surface border border-black/5 p-5 rounded-2xl mb-4">
          <Text className="text-muted font-medium mb-1">Monthly Spend</Text>
          <Text className="text-4xl font-bold text-amber mb-2">₹1,846</Text>
          <Text className="text-xs text-muted">≈ ₹22,152 yearly</Text>
        </View>

        <Text className="text-title font-bold text-text mt-4 mb-3">Upcoming</Text>
        <View className="bg-surface border border-black/5 p-4 rounded-2xl">
          <View className="flex-row items-center justify-between py-2">
            <View className="flex-row items-center gap-3">
              <View className="w-10 h-10 rounded-xl bg-[#E50914] items-center justify-center">
                <Text className="text-white font-bold">N</Text>
              </View>
              <View>
                <Text className="font-bold text-text">Netflix</Text>
                <Text className="text-xs text-muted">Due in 3 days</Text>
              </View>
            </View>
            <Text className="font-bold text-text text-right">₹649</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
