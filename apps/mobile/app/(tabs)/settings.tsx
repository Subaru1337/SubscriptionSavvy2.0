import { View, Text, ScrollView, SafeAreaView } from "react-native";
import { Settings } from "lucide-react-native";

export default function SettingsScreen() {
  return (
    <SafeAreaView className="flex-1 bg-base">
      <ScrollView contentContainerClassName="p-6">
        <View className="flex-row items-center gap-3 mb-6">
          <View className="w-10 h-10 rounded-xl bg-surface-2 items-center justify-center border border-white/10">
            <Settings size={20} color="#E6EDF3" />
          </View>
          <Text className="text-3xl font-bold text-text">Settings</Text>
        </View>

        <View className="bg-surface border border-white/10 p-5 rounded-2xl mb-4">
          <Text className="text-center text-muted">User settings</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
