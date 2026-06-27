import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function TermsScreen() {
  const router = useRouter();

  return (
    <SafeAreaView className="flex-1 bg-[#0E0F14]">
      <View className="flex-row items-center px-4 py-3 border-b border-white/5">
        <TouchableOpacity onPress={() => router.back()} className="p-2">
          <Feather name="arrow-left" size={24} color="#FFF" />
        </TouchableOpacity>
        <Text className="text-white text-lg font-bold ml-2" style={{ fontFamily: 'PlusJakartaSans_700Bold' }}>Terms of Service</Text>
      </View>
      
      <ScrollView className="flex-1 px-6 py-6" contentContainerStyle={{ paddingBottom: 40 }}>
        <Text className="text-white text-xl font-bold mb-4" style={{ fontFamily: 'PlusJakartaSans_700Bold' }}>1. Introduction</Text>
        <Text className="text-[#9CA3AF] text-[15px] leading-6 mb-6" style={{ fontFamily: 'PlusJakartaSans_500Medium' }}>
          Welcome to Subsavvy. By accessing or using our mobile application, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our services.
        </Text>

        <Text className="text-white text-xl font-bold mb-4" style={{ fontFamily: 'PlusJakartaSans_700Bold' }}>2. Use of Service</Text>
        <Text className="text-[#9CA3AF] text-[15px] leading-6 mb-6" style={{ fontFamily: 'PlusJakartaSans_500Medium' }}>
          Subsavvy provides a subscription management tool. You agree to use the service only for lawful purposes and in accordance with these terms. You are responsible for all activities that occur under your account.
        </Text>

        <Text className="text-white text-xl font-bold mb-4" style={{ fontFamily: 'PlusJakartaSans_700Bold' }}>3. Data and Privacy</Text>
        <Text className="text-[#9CA3AF] text-[15px] leading-6 mb-6" style={{ fontFamily: 'PlusJakartaSans_500Medium' }}>
          Your privacy is important to us. Please review our Privacy Policy to understand how we collect, use, and share information about you.
        </Text>

        <Text className="text-white text-xl font-bold mb-4" style={{ fontFamily: 'PlusJakartaSans_700Bold' }}>4. Termination</Text>
        <Text className="text-[#9CA3AF] text-[15px] leading-6 mb-6" style={{ fontFamily: 'PlusJakartaSans_500Medium' }}>
          We may terminate or suspend your account and bar access to the service immediately, without prior notice or liability, under our sole discretion, for any reason whatsoever and without limitation, including but not limited to a breach of the Terms.
        </Text>

        <Text className="text-white text-xl font-bold mb-4" style={{ fontFamily: 'PlusJakartaSans_700Bold' }}>5. Changes to Terms</Text>
        <Text className="text-[#9CA3AF] text-[15px] leading-6 mb-6" style={{ fontFamily: 'PlusJakartaSans_500Medium' }}>
          We reserve the right to modify these terms at any time. We will notify users of any material changes. Your continued use of the service after such modifications will constitute your acknowledgment of the modified terms.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}
