import { View, Text, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import * as SecureStore from 'expo-secure-store';

export default function CustomHeader() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [firstName, setFirstName] = useState('');
  const [initial, setInitial] = useState('?');

  useEffect(() => {
    const loadUser = async () => {
      try {
        const raw = await SecureStore.getItemAsync('user_data');
        if (raw) {
          const data = JSON.parse(raw);
          const name = data.name || data.email || '';
          // Extract first name (before space) or use email prefix
          const first = name.includes(' ')
            ? name.split(' ')[0]
            : name.includes('@')
            ? name.split('@')[0]
            : name;
          setFirstName(first);
          setInitial(first.charAt(0).toUpperCase());
        }
      } catch (e) {
        console.error(e);
      }
    };
    loadUser();
  }, []);

  const today = new Date();
  const options: Intl.DateTimeFormatOptions = { weekday: 'long', month: 'short', day: 'numeric' };
  const dateString = today.toLocaleDateString('en-US', options);

  const hour = today.getHours();
  let greeting = 'Good evening';
  if (hour < 12) greeting = 'Good morning';
  else if (hour < 18) greeting = 'Good afternoon';

  return (
    <View 
      className="flex-row items-center justify-between px-6 pb-4 bg-[#F4F6F9]"
      style={{ paddingTop: Math.max(insets.top, 16) }}
    >
      <View>
        <Text className="text-2xl font-bold text-[#111827] mb-1" style={{ fontFamily: 'PlusJakartaSans_700Bold' }}>
          {greeting}{firstName ? `, ${firstName}` : ''} 👋
        </Text>
        <Text className="text-xs font-medium text-[#6B7280]" style={{ fontFamily: 'PlusJakartaSans_500Medium' }}>
          {dateString}
        </Text>
      </View>
      <TouchableOpacity 
        onPress={() => router.push('/settings')}
        className="w-12 h-12 rounded-full bg-[#0D7377] items-center justify-center shadow-sm"
      >
        <Text className="text-white font-bold text-lg" style={{ fontFamily: 'PlusJakartaSans_700Bold' }}>{initial}</Text>
      </TouchableOpacity>
    </View>
  );
}

