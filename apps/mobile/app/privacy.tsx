import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function PrivacyScreen() {
  const router = useRouter();

  return (
    <SafeAreaView className="flex-1 bg-[#0E0F14]">
      <View className="flex-row items-center px-4 py-3 border-b border-white/5">
        <TouchableOpacity onPress={() => router.back()} className="p-2">
          <Feather name="arrow-left" size={24} color="#FFF" />
        </TouchableOpacity>
        <Text className="text-white text-lg font-bold ml-2" style={{ fontFamily: 'PlusJakartaSans_700Bold' }}>Privacy Policy</Text>
      </View>
      
      <ScrollView className="flex-1 px-6 py-6" contentContainerStyle={{ paddingBottom: 40 }}>
        <Text className="text-white text-xl font-bold mb-4" style={{ fontFamily: 'PlusJakartaSans_700Bold' }}>1. Information We Collect</Text>
        <Text className="text-[#9CA3AF] text-[15px] leading-6 mb-6" style={{ fontFamily: 'PlusJakartaSans_500Medium' }}>
          When you use Subsavvy, we collect information you provide directly to us, such as when you create an account, enter subscription details, or contact customer support. We also automatically collect certain information about your device and usage patterns.
        </Text>

        <Text className="text-white text-xl font-bold mb-4" style={{ fontFamily: 'PlusJakartaSans_700Bold' }}>2. How We Use Your Information</Text>
        <Text className="text-[#9CA3AF] text-[15px] leading-6 mb-6" style={{ fontFamily: 'PlusJakartaSans_500Medium' }}>
          We use the information we collect to provide, maintain, and improve our services, as well as to develop new features, protect Subsavvy and our users, and communicate with you about updates and alerts.
        </Text>

        <Text className="text-white text-xl font-bold mb-4" style={{ fontFamily: 'PlusJakartaSans_700Bold' }}>3. Data Security</Text>
        <Text className="text-[#9CA3AF] text-[15px] leading-6 mb-6" style={{ fontFamily: 'PlusJakartaSans_500Medium' }}>
          We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction.
        </Text>

        <Text className="text-white text-xl font-bold mb-4" style={{ fontFamily: 'PlusJakartaSans_700Bold' }}>4. Third-Party Services</Text>
        <Text className="text-[#9CA3AF] text-[15px] leading-6 mb-6" style={{ fontFamily: 'PlusJakartaSans_500Medium' }}>
          We may employ third-party companies and individuals to facilitate our service, provide the service on our behalf, or assist us in analyzing how our service is used. These third parties have access to your personal information only to perform these tasks.
        </Text>

        <Text className="text-white text-xl font-bold mb-4" style={{ fontFamily: 'PlusJakartaSans_700Bold' }}>5. Your Rights</Text>
        <Text className="text-[#9CA3AF] text-[15px] leading-6 mb-6" style={{ fontFamily: 'PlusJakartaSans_500Medium' }}>
          You have the right to access, correct, or delete your personal data. You can usually manage your information directly within the app settings, or contact us for assistance.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}
