import { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { api } from '../lib/api';
import { Feather } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = await SecureStore.getItemAsync('auth_token');
        if (token) {
          router.replace('/(tabs)');
        } else {
          setIsCheckingAuth(false);
        }
      } catch (error) {
        console.error('Failed to check auth token', error);
        setIsCheckingAuth(false);
      }
    };

    checkAuth();
  }, []);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter both email and password');
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/auth/login', { email, password });
      
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
        'Login Failed', 
        error.response?.data?.error || 'Could not connect to the server'
      );
    } finally {
      setLoading(false);
    }
  };

  if (isCheckingAuth) {
    return (
      <View className="flex-1 bg-[#0D7377] justify-center items-center">
        <ActivityIndicator size="large" color="white" />
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-[#0D7377] justify-center p-6">
      <View className="bg-white rounded-xl p-8 shadow-lg">
        {/* Mock Logo */}
        <View className="items-center mb-6">
          <View className="bg-[#0D7377] w-12 h-12 rounded-lg items-center justify-center">
            <Feather name="shield" size={24} color="white" />
          </View>
        </View>

        <Text className="text-2xl font-bold text-center text-[#111827] mb-2">Welcome Back</Text>
        <Text className="text-center text-[#4B5563] text-sm mb-8 px-2">
          Enter your credentials to access your subscriptions.
        </Text>

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

        <View className="mb-6">
          <View className="flex-row justify-between items-center mb-2">
            <Text className="text-[10px] font-bold tracking-widest text-[#4B5563] uppercase">Password</Text>
            <TouchableOpacity>
              <Text className="text-[11px] text-[#0D7377]">Forgot Password?</Text>
            </TouchableOpacity>
          </View>
          <View className="relative justify-center">
            <TextInput
              className="border border-gray-200 rounded-lg p-3 pr-12 text-base text-gray-900 bg-white"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              placeholder="••••••••"
              placeholderTextColor="#9CA3AF"
            />
            <TouchableOpacity 
              className="absolute right-4"
              onPress={() => setShowPassword(!showPassword)}
            >
              <Feather name={showPassword ? "eye-off" : "eye"} size={20} color="#6B7280" />
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity 
          className="bg-[#0D7377] p-4 rounded-lg items-center mb-6"
          onPress={handleLogin}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text className="text-white text-base font-bold">Sign In</Text>
          )}
        </TouchableOpacity>

        <View className="flex-row justify-center items-center">
          <Text className="text-sm text-[#4B5563]">Don't have an account? </Text>
          <TouchableOpacity onPress={() => router.push('/register')}>
            <Text className="text-sm font-bold text-[#0D7377]">Sign up</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}
