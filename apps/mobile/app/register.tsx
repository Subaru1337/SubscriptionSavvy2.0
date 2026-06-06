import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, ActivityIndicator, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { api } from '../lib/api';
import { Feather } from '@expo/vector-icons';

export default function RegisterScreen() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
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
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-[#0E0F14]"
    >
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} bounces={false} showsVerticalScrollIndicator={false}>
        
        {/* Header Area */}
        <View className="bg-[#15171E] rounded-b-[40px] pt-16 pb-8 px-8 mb-6">
          <View className="flex-row items-center justify-center space-x-2 mb-4">
            <View className="w-8 h-8 rounded-lg bg-[#0D9E75] items-center justify-center">
              <Feather name="shield" size={16} color="#FFF" />
            </View>
            <Text className="text-white font-bold text-lg tracking-widest" style={{ fontFamily: 'PlusJakartaSans_700Bold' }}>SAVVY</Text>
          </View>
          <Text className="text-white text-2xl font-bold text-center mb-2" style={{ fontFamily: 'PlusJakartaSans_700Bold' }}>Create Account</Text>
          <Text className="text-[#9CA3AF] text-[13px] text-center px-4" style={{ fontFamily: 'PlusJakartaSans_500Medium' }}>
            Join SubscriptionSavvy to streamline your financial life and never miss a renewal.
          </Text>
        </View>

        {/* Form Area */}
        <View className="flex-1 px-8 pb-8 justify-center">
          
          <View className="mb-5">
            <Text className="text-[10px] font-bold tracking-widest text-[#9CA3AF] mb-2 uppercase" style={{ fontFamily: 'PlusJakartaSans_700Bold' }}>Full Name</Text>
            <View className="flex-row items-center bg-[#15171E] border border-white/5 rounded-[16px] px-4 h-[56px]">
              <Feather name="user" size={18} color="#6B7280" className="mr-3" />
              <TextInput
                className="flex-1 text-white text-[15px]"
                style={{ fontFamily: 'PlusJakartaSans_500Medium' }}
                value={name}
                onChangeText={setName}
                placeholder="John Doe"
                placeholderTextColor="#6B7280"
              />
            </View>
          </View>

          <View className="mb-5">
            <Text className="text-[10px] font-bold tracking-widest text-[#9CA3AF] mb-2 uppercase" style={{ fontFamily: 'PlusJakartaSans_700Bold' }}>Email Address</Text>
            <View className="flex-row items-center bg-[#15171E] border border-white/5 rounded-[16px] px-4 h-[56px]">
              <Feather name="mail" size={18} color="#6B7280" className="mr-3" />
              <TextInput
                className="flex-1 text-white text-[15px]"
                style={{ fontFamily: 'PlusJakartaSans_500Medium' }}
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                placeholder="name@company.com"
                placeholderTextColor="#6B7280"
              />
            </View>
          </View>

          <View className="mb-6">
            <Text className="text-[10px] font-bold tracking-widest text-[#9CA3AF] mb-2 uppercase" style={{ fontFamily: 'PlusJakartaSans_700Bold' }}>Password</Text>
            <View className="flex-row items-center bg-[#15171E] border border-white/5 rounded-[16px] px-4 h-[56px]">
              <Feather name="lock" size={18} color="#6B7280" className="mr-3" />
              <TextInput
                className="flex-1 text-white text-[15px]"
                style={{ fontFamily: 'PlusJakartaSans_500Medium' }}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                placeholder="••••••••"
                placeholderTextColor="#6B7280"
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)} className="pl-3 py-2">
                <Feather name={showPassword ? "eye-off" : "eye"} size={18} color="#6B7280" />
              </TouchableOpacity>
            </View>
            <Text className="text-[11px] text-[#6B7280] mt-2" style={{ fontFamily: 'PlusJakartaSans_500Medium' }}>
              Must be at least 8 characters long.
            </Text>
          </View>

          <TouchableOpacity 
            className="flex-row items-center mb-8 pr-4"
            onPress={() => setAgreed(!agreed)}
            activeOpacity={0.7}
          >
            <View className={`w-5 h-5 rounded-[6px] items-center justify-center mr-3 ${agreed ? 'bg-[#1DCCA0]' : 'border border-[#4B5563]'}`}>
              {agreed && <Feather name="check" size={12} color="#0E0F14" />}
            </View>
            <Text className="text-[13px] text-[#9CA3AF] leading-5" style={{ fontFamily: 'PlusJakartaSans_500Medium' }}>
              I agree to the <Text className="text-[#1DCCA0] font-bold" style={{ fontFamily: 'PlusJakartaSans_700Bold' }}>Terms of Service</Text> and <Text className="text-[#1DCCA0] font-bold" style={{ fontFamily: 'PlusJakartaSans_700Bold' }}>Privacy Policy</Text>.
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            className="bg-[#0D9E75] h-[56px] rounded-[16px] items-center justify-center mb-6 shadow-sm"
            onPress={handleRegister}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text className="text-white text-[14px] font-bold uppercase tracking-widest" style={{ fontFamily: 'PlusJakartaSans_700Bold' }}>Create Account</Text>
            )}
          </TouchableOpacity>

          <View className="flex-row justify-center items-center">
            <Text className="text-[13px] text-[#6B7280]" style={{ fontFamily: 'PlusJakartaSans_500Medium' }}>Already have an account? </Text>
            <TouchableOpacity onPress={() => router.replace('/')}>
              <Text className="text-[13px] font-bold text-[#1DCCA0]" style={{ fontFamily: 'PlusJakartaSans_700Bold' }}>Log in</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
