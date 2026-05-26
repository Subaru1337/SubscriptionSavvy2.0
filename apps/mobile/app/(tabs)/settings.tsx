import { View, Text, TouchableOpacity, Alert, Switch } from 'react-native';
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { Feather } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import * as Notifications from 'expo-notifications';

export default function SettingsScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [remindersEnabled, setRemindersEnabled] = useState(false);

  useEffect(() => {
    SecureStore.getItemAsync('user_data').then(data => {
      if (data) setEmail(JSON.parse(data).email);
    });
    
    // Check notification permissions
    Notifications.getPermissionsAsync().then(settings => {
      setRemindersEnabled(settings.granted || settings.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL);
    });
  }, []);

  const handleToggleReminders = async (value: boolean) => {
    if (value) {
      const { status } = await Notifications.requestPermissionsAsync();
      if (status === 'granted') {
        setRemindersEnabled(true);
        Alert.alert("Success", "Reminders enabled! You will now be notified 1 day before payments are due.");
      } else {
        Alert.alert("Permission Denied", "Please enable notifications in your phone's settings.");
        setRemindersEnabled(false);
      }
    } else {
      setRemindersEnabled(false);
      Alert.alert("Reminders Disabled", "You will no longer receive push notifications.");
    }
  };

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

      <View className="bg-card p-4 rounded-xl shadow-sm border border-border mb-6">
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center space-x-3">
            <View className="w-10 h-10 rounded-full bg-orange-100 items-center justify-center">
              <Feather name="bell" size={20} color="#F59E0B" />
            </View>
            <View>
              <Text className="text-text-primary font-medium text-lg">Reminders</Text>
              <Text className="text-text-secondary text-xs">Notify me 1 day before due</Text>
            </View>
          </View>
          <Switch
            value={remindersEnabled}
            onValueChange={handleToggleReminders}
            trackColor={{ false: "#E8E2D9", true: "#0D7377" }}
          />
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
