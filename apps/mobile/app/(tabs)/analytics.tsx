import { View, Text, ScrollView, SafeAreaView } from "react-native";
import { BarChart2 } from "lucide-react-native";

export default function AnalyticsScreen() {
  return (
    <SafeAreaView className="flex-1 bg-base">
      <ScrollView contentContainerClassName="p-6">
        <View className="flex-row items-center gap-3 mb-6">
          <View className="w-10 h-10 rounded-xl bg-[#58A6FF]/15 items-center justify-center border border-[#58A6FF]/30">
            <BarChart2 size={20} color="#58A6FF" />
          </View>
          <Text className="text-3xl font-bold text-text">Analytics</Text>
        </View>

        <View className="bg-surface border border-white/10 p-5 rounded-2xl mb-4">
          <Text className="text-center text-muted">Charts will appear here.</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
