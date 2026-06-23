import { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, ActivityIndicator, ScrollView, Dimensions, KeyboardAvoidingView, Platform, Keyboard } from 'react-native';
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { api } from '../lib/api';
import { Feather } from '@expo/vector-icons';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, interpolate, Extrapolation } from 'react-native-reanimated';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const FEATURES = [
  {
    icon: 'bell',
    title: 'Never Miss a Renewal',
    desc: 'Smart notifications alert you before you get charged for anything.',
    color: '#F59E0B'
  },
  {
    icon: 'activity',
    title: 'Subscription Health',
    desc: 'AI-driven insights to optimize your spending and save money.',
    color: '#10B981'
  },
  {
    icon: 'scissors',
    title: 'One-Tap Pruning',
    desc: 'Easily identify and cut out unused subscriptions instantly.',
    color: '#EC4899'
  },
  {
    icon: 'pie-chart',
    title: 'Visual Analytics',
    desc: 'Beautiful charts tracking your monthly and annual habits.',
    color: '#0D9E75'
  }
];

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isKeyboardVisible, setKeyboardVisible] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const showSub = Keyboard.addListener(Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow', () => setKeyboardVisible(true));
    const hideSub = Keyboard.addListener(Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide', () => setKeyboardVisible(false));
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = await SecureStore.getItemAsync('auth_token');
        if (token) {
          // Validate token against the server before navigating
          try {
            await api.get('/auth/me');
            router.replace('/(tabs)');
          } catch {
            // Token is invalid/expired — clear it and show login
            await SecureStore.deleteItemAsync('auth_token');
            await SecureStore.deleteItemAsync('user_data');
            setIsCheckingAuth(false);
          }
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
      <View className="flex-1 bg-[#0E0F14] justify-center items-center">
        <ActivityIndicator size="large" color="#1DCCA0" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      className="flex-1 bg-[#0E0F14]"
    >
      <ScrollView 
        contentContainerStyle={{ flexGrow: 1, paddingBottom: Platform.OS === 'ios' ? 40 : 20 }} 
        bounces={false} 
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        
        {/* Onboarding Carousel Area */}
        {!isKeyboardVisible && (
          <View style={{ height: SCREEN_HEIGHT * 0.45 }} className="bg-[#15171E] rounded-b-[40px] pt-16 overflow-hidden">
            {/* Logo */}
          <View className="flex-row items-center justify-center space-x-2 mb-6">
            <View className="w-8 h-8 rounded-lg bg-[#0D9E75] items-center justify-center">
              <Feather name="shield" size={16} color="#FFF" />
            </View>
            <Text className="text-white font-bold text-lg tracking-widest" style={{ fontFamily: 'PlusJakartaSans_700Bold' }}>SAVVY</Text>
          </View>

          <ScrollView 
            horizontal 
            pagingEnabled 
            showsHorizontalScrollIndicator={false}
            onScroll={(e) => {
              const slide = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
              if (slide !== activeIndex) setActiveIndex(slide);
            }}
            scrollEventThrottle={16}
          >
            {FEATURES.map((feat, idx) => (
              <View key={idx} style={{ width: SCREEN_WIDTH }} className="items-center justify-center px-8 pb-10">
                <View className="w-16 h-16 rounded-[20px] items-center justify-center mb-6" style={{ backgroundColor: `${feat.color}20` }}>
                  <Feather name={feat.icon as any} size={28} color={feat.color} />
                </View>
                <Text className="text-white text-2xl font-bold text-center mb-3" style={{ fontFamily: 'PlusJakartaSans_700Bold' }}>
                  {feat.title}
                </Text>
                <Text className="text-[#9CA3AF] text-center text-[15px] leading-6" style={{ fontFamily: 'PlusJakartaSans_500Medium' }}>
                  {feat.desc}
                </Text>
              </View>
            ))}
          </ScrollView>

          {/* Dots */}
          <View className="flex-row justify-center space-x-2 absolute bottom-6 w-full">
            {FEATURES.map((_, idx) => (
              <View 
                key={idx} 
                className={`h-1.5 rounded-full ${idx === activeIndex ? 'w-6 bg-[#1DCCA0]' : 'w-1.5 bg-[#4B5563]'}`} 
              />
            ))}
          </View>
        </View>
        )}

        {/* Login Form Area */}
        <View className="flex-1 px-8 pt-10 pb-8 justify-center">
          <Text className="text-white text-2xl font-bold mb-2" style={{ fontFamily: 'PlusJakartaSans_700Bold' }}>Welcome Back</Text>
          <Text className="text-[#6B7280] text-[13px] mb-8" style={{ fontFamily: 'PlusJakartaSans_500Medium' }}>
            Enter your credentials to manage your subscriptions.
          </Text>

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

          <View className="mb-8">
            <View className="flex-row justify-between items-center mb-2">
              <Text className="text-[10px] font-bold tracking-widest text-[#9CA3AF] uppercase" style={{ fontFamily: 'PlusJakartaSans_700Bold' }}>Password</Text>
              <TouchableOpacity>
                <Text className="text-[11px] font-bold text-[#1DCCA0]" style={{ fontFamily: 'PlusJakartaSans_700Bold' }}>Forgot Password?</Text>
              </TouchableOpacity>
            </View>
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
          </View>

          <TouchableOpacity 
            className="bg-[#0D9E75] h-[56px] rounded-[16px] items-center justify-center mb-6 shadow-sm"
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text className="text-white text-[14px] font-bold uppercase tracking-widest" style={{ fontFamily: 'PlusJakartaSans_700Bold' }}>Sign In</Text>
            )}
          </TouchableOpacity>

          <View className="flex-row justify-center items-center">
            <Text className="text-[13px] text-[#6B7280]" style={{ fontFamily: 'PlusJakartaSans_500Medium' }}>Don't have an account? </Text>
            <TouchableOpacity onPress={() => router.push('/register')}>
              <Text className="text-[13px] font-bold text-[#1DCCA0]" style={{ fontFamily: 'PlusJakartaSans_700Bold' }}>Sign up</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
