import { View, Text, ScrollView, SafeAreaView, TouchableOpacity } from "react-native";
import { CreditCard, Plus } from "lucide-react-native";

export default function SubscriptionsScreen() {
  return (
    <SafeAreaView className="flex-1 bg-base">
      <ScrollView contentContainerClassName="p-6">
        <View className="flex-row items-center justify-between mb-6">
          <View className="flex-row items-center gap-3">
            <View className="w-10 h-10 rounded-xl bg-surface-2 items-center justify-center border border-black/5">
              <CreditCard size={20} color="#1A1A1A" />
            </View>
            <Text className="text-3xl font-bold text-text">Subs</Text>
          </View>
          
          <TouchableOpacity className="bg-amber px-4 py-2 rounded-lg flex-row items-center gap-1">
            <Plus size={16} color="#000" />
            <Text className="text-black font-bold text-sm">Add</Text>
          </TouchableOpacity>
        </View>

        <View className="bg-surface border border-black/5 p-5 rounded-2xl mb-4">
          <Text className="text-center text-muted">Subscriptions list will appear here.</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
