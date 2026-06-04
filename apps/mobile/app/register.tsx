import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, ActivityIndicator, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { api } from '../lib/api';
import { Feather } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function RegisterScreen() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleRegister = async () => {
    if (!name || !email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
    if (!agreed) {
      Alert.alert('Error', 'You must agree to the Terms of Service and Privacy Policy');
      return;
    }
    if (password.length < 8) {
      Alert.alert('Error', 'Password must be at least 8 characters long');
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/auth/register', { name, email, password });
      
      const { token, user } = response.data;
      if (token) {
        await SecureStore.setItemAsync('auth_token', token);
        await SecureStore.setItemAsync('user_data', JSON.stringify(user));
        
        router.replace('/(tabs)');
      } else {
        Alert.alert('Error', 'No token received from server');
      }
    } catch (error: any) {
      console.error(error);
      Alert.alert(
        'Registration Failed', 
        error.response?.data?.error || 'Could not connect to the server'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-[#0D7377]">
      <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 24 }}>
        
        {/* Logo and Name outside the card */}
        <View className="flex-row items-center mb-6 pl-2">
          <Feather name="shield" size={24} color="white" />
          <Text className="text-white text-xl font-bold ml-2">SubscriptionSavvy</Text>
        </View>

        <View className="bg-white rounded-xl p-8 shadow-lg">
          <Text className="text-2xl font-bold text-center text-[#111827] mb-2">Create Account</Text>
          <Text className="text-center text-[#4B5563] text-sm mb-8 px-2">
            Join SubscriptionSavvy to streamline your financial life.
          </Text>

          <View className="mb-5">
            <Text className="text-[10px] font-bold tracking-widest text-[#4B5563] mb-2 uppercase">Full Name</Text>
            <TextInput
              className="border border-gray-200 rounded-lg p-3 text-base text-gray-900 bg-white"
              value={name}
              onChangeText={setName}
              placeholder="John Doe"
              placeholderTextColor="#9CA3AF"
            />
          </View>

          <View className="mb-5">
            <Text className="text-[10px] font-bold tracking-widest text-[#4B5563] mb-2 uppercase">Email Address</Text>
            <TextInput
              className="border border-gray-200 rounded-lg p-3 text-base text-gray-900 bg-white"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              placeholder="name@company.com"
              placeholderTextColor="#9CA3AF"
            />
          </View>

          <View className="mb-5">
            <Text className="text-[10px] font-bold tracking-widest text-[#4B5563] mb-2 uppercase">Password</Text>
            <TextInput
              className="border border-gray-200 rounded-lg p-3 text-base text-gray-900 bg-white"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              placeholder="••••••••"
              placeholderTextColor="#9CA3AF"
            />
            <Text className="text-xs text-[#6B7280] mt-2">
              Must be at least 8 characters long.
            </Text>
          </View>

          <TouchableOpacity 
            className="flex-row items-center mb-8 pr-4"
            onPress={() => setAgreed(!agreed)}
          >
            <View className={`w-5 h-5 border rounded flex items-center justify-center mr-3 ${agreed ? 'bg-[#0D7377] border-[#0D7377]' : 'border-gray-300'}`}>
              {agreed && <Feather name="check" size={14} color="white" />}
            </View>
            <Text className="text-xs text-[#4B5563] leading-5">
              I agree to the <Text className="text-[#0D7377]">Terms of Service</Text> and <Text className="text-[#0D7377]">Privacy Policy</Text>.
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            className="bg-[#0D7377] p-4 rounded-lg items-center mb-6"
            onPress={handleRegister}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text className="text-white text-base font-bold">Create Account</Text>
            )}
          </TouchableOpacity>

          <View className="flex-row justify-center items-center">
            <Text className="text-sm text-[#4B5563]">Already have an account? </Text>
            <TouchableOpacity onPress={() => router.replace('/')}>
              <Text className="text-sm font-bold text-[#0D7377]">Log in</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
