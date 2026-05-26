import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { Feather } from '@expo/vector-icons';
import { useEffect, useState } from 'react';

export default function SettingsScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');

  useEffect(() => {
    SecureStore.getItemAsync('user_data').then(data => {
      if (data) setEmail(JSON.parse(data).email);
    });
  }, []);

  const handleLogout = async () => {
    Alert.alert('Log Out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      { 
        text: 'Log Out', 
        style: 'destructive',
        onPress: async () => {
          await SecureStore.deleteItemAsync('auth_token');
          await SecureStore.deleteItemAsync('user_data');
          router.replace('/');
        }
      }
    ]);
  };

  return (
    <View className="flex-1 bg-background p-4">
      <Text className="text-2xl font-bold text-text-primary mb-6">Settings</Text>

      <View className="bg-card p-4 rounded-2xl shadow-sm border border-border mb-6">
        <View className="flex-row items-center space-x-3 mb-4">
          <View className="w-12 h-12 rounded-full bg-[#E6F4FE] items-center justify-center">
            <Feather name="user" size={24} color="#0D7377" />
          </View>
          <View>
            <Text className="text-text-secondary text-sm">Logged in as</Text>
            <Text className="text-text-primary font-bold text-base">{email}</Text>
          </View>
        </View>
      </View>

      <TouchableOpacity 
        className="bg-card p-4 rounded-xl shadow-sm border border-border flex-row items-center justify-between"
        onPress={handleLogout}
      >
        <View className="flex-row items-center space-x-3">
          <Feather name="log-out" size={20} color="#EF4444" />
          <Text className="text-overdue font-medium text-lg">Log Out</Text>
        </View>
        <Feather name="chevron-right" size={20} color="#EF4444" />
      </TouchableOpacity>
    </View>
  );
}
