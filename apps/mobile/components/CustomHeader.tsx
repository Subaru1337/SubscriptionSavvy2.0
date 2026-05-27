import { View, Text, Image } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function CustomHeader() {
  const insets = useSafeAreaInsets();
  return (
    <View 
      className="flex-row items-center justify-between px-4 pb-3 bg-white border-b border-gray-100"
      style={{ paddingTop: Math.max(insets.top, 16) }}
    >
      <View className="flex-row items-center space-x-2">
        <Feather name="layers" size={20} color="#0D7377" />
        <Text className="text-xl font-bold text-[#0D7377]">
          SubscriptionSavvy
        </Text>
      </View>
      <Image 
        source={{ uri: 'https://i.pravatar.cc/150?img=11' }} 
        className="w-9 h-9 rounded-full bg-gray-200"
      />
    </View>
  );
}
