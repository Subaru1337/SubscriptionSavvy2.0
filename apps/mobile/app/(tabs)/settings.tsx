import {
  View, Text, TouchableOpacity, Alert, Switch, ScrollView,
  TextInput, ActivityIndicator, Linking
} from 'react-native';
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { Feather } from '@expo/vector-icons';
import { useEffect, useState, useCallback } from 'react';
import { api, API_URL } from '../../lib/api';
import {
  arePushNotificationsAvailable,
  getPushPermissionGranted,
  requestPushPermissions,
} from '../../lib/push-notifications';
import { refreshBaseCurrency } from '../../lib/useBaseCurrency';

const CURRENCIES = ['USD', 'INR', 'EUR', 'GBP', 'AED', 'SGD', 'AUD', 'CAD'];
const CATEGORIES = ['Entertainment', 'Productivity', 'Health', 'Education', 'Finance', 'Shopping', 'Developer Tools', 'Other'];

type CategoryBudget = {
  id?: string;
  category: string;
  limit: string | number;
  currency: string;
};

export default function SettingsScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [pushReminders, setPushReminders] = useState(false);
  const [loading, setLoading] = useState(true);
  const [savingSettings, setSavingSettings] = useState(false);
  const [exporting, setExporting] = useState(false);

  // Server-synced settings
  const [baseCurrency, setBaseCurrency] = useState('USD');
  const [monthlyBudget, setMonthlyBudget] = useState('');
  const [emailReminders, setEmailReminders] = useState(false);

  // Category budgets
  const [categoryBudgets, setCategoryBudgets] = useState<CategoryBudget[]>([]);
  const [editingBudget, setEditingBudget] = useState<string | null>(null);
  const [budgetInput, setBudgetInput] = useState('');

  const fetchSettings = useCallback(async () => {
    setLoading(true);
    try {
      const userData = await SecureStore.getItemAsync('user_data');
      if (userData) setEmail(JSON.parse(userData).email || '');

      if (arePushNotificationsAvailable()) {
        setPushReminders(await getPushPermissionGranted());
      }

      const [settingsRes, budgetsRes] = await Promise.allSettled([
        api.get('/settings'),
        api.get('/category-budgets'),
      ]);

      if (settingsRes.status === 'fulfilled') {
        const user = settingsRes.value.data?.user;
        if (user) {
          setBaseCurrency(user.baseCurrency ?? 'USD');
          setMonthlyBudget(user.monthlyBudget ? String(Number(user.monthlyBudget).toFixed(2)) : '');
          setEmailReminders(user.emailReminders ?? false);
        }
      }
      if (budgetsRes.status === 'fulfilled') {
        setCategoryBudgets(budgetsRes.value.data?.budgets ?? []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchSettings(); }, [fetchSettings]);

  const saveServerSettings = async () => {
    setSavingSettings(true);
    try {
      await api.put('/settings', {
        baseCurrency,
        monthlyBudget: monthlyBudget ? parseFloat(monthlyBudget) : null,
        emailReminders,
      });
      await refreshBaseCurrency();
      Alert.alert('Saved', 'Your settings have been updated.');
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.error ?? 'Failed to save settings');
    } finally {
      setSavingSettings(false);
    }
  };

  const handleTogglePush = async (value: boolean) => {
    if (!arePushNotificationsAvailable()) {
      Alert.alert(
        'Not available in Expo Go',
        'Push notifications require a development build. Use email reminders for now, or run: npx expo run:android',
      );
      return;
    }

    if (value) {
      const granted = await requestPushPermissions();
      if (granted) {
        setPushReminders(true);
        Alert.alert('Enabled', 'You will be notified 1 day before payments are due.');
      } else {
        Alert.alert('Permission Denied', "Please enable notifications in your phone's settings.");
        setPushReminders(false);
      }
    } else {
      setPushReminders(false);
      Alert.alert('Disabled', 'Push notifications turned off.');
    }
  };

  const saveCategoryBudget = async (category: string) => {
    const limit = parseFloat(budgetInput);
    if (isNaN(limit) || limit <= 0) {
      Alert.alert('Error', 'Please enter a valid budget amount');
      return;
    }
    try {
      await api.post('/category-budgets', { category, limit, currency: baseCurrency });
      setEditingBudget(null);
      setBudgetInput('');
      fetchSettings();
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.error ?? 'Failed to save category budget');
    }
  };

  const handleExportCSV = async () => {
    setExporting(true);
    try {
      const token = await SecureStore.getItemAsync('auth_token');
      // Open export URL in browser — the server returns a CSV file download
      const url = `${API_URL}/export/csv?status=all&token=${token}`;
      // Try the direct URL; some environments support file downloads via Linking
      await Linking.openURL(`${API_URL}/export/csv?status=all`);
    } catch {
      Alert.alert('Export', 'Opening CSV export in your browser...');
    } finally {
      setExporting(false);
    }
  };

  const handleExportPDF = async () => {
    try {
      await Linking.openURL(`${API_URL}/export/pdf`);
    } catch {
      Alert.alert('Error', 'Could not open export URL');
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
          
          // Defer navigation to allow the Alert dialog to fully close first (iOS quirk)
          setTimeout(() => {
            router.replace('/');
          }, 100);
        },
      },
    ]);
  };

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-[#F4F6F9]">
        <ActivityIndicator size="large" color="#0D9E75" />
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-[#F4F6F9]" contentContainerStyle={{ padding: 24, paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
      <Text className="text-3xl font-bold text-[#111827] mb-8 mt-4" style={{ fontFamily: 'PlusJakartaSans_700Bold' }}>Settings</Text>

      {/* ── Account ──────────────────────────────────── */}
      <View className="bg-white p-5 rounded-[24px] shadow-sm mb-6 border border-gray-100 flex-row items-center space-x-4">
        <View className="w-14 h-14 rounded-[16px] bg-[#0D9E75] items-center justify-center shadow-sm">
          <Feather name="user" size={24} color="#FFF" />
        </View>
        <View className="flex-1">
          <Text className="text-[#6B7280] text-[10px] font-bold uppercase tracking-widest mb-1" style={{ fontFamily: 'PlusJakartaSans_700Bold' }}>Account</Text>
          <Text className="text-[#111827] font-bold text-base" style={{ fontFamily: 'PlusJakartaSans_700Bold' }}>{email}</Text>
        </View>
      </View>

      {/* ── Financial Settings ────────────────────────── */}
      <View className="bg-white p-6 rounded-[24px] shadow-sm mb-6 border border-gray-100">
        <View className="flex-row items-center space-x-3 mb-6">
          <Feather name="pie-chart" size={20} color="#0D9E75" />
          <Text className="text-[#111827] font-bold text-lg" style={{ fontFamily: 'PlusJakartaSans_700Bold' }}>Financial Settings</Text>
        </View>

        <Text className="text-[#6B7280] text-[11px] font-bold uppercase tracking-widest mb-3" style={{ fontFamily: 'PlusJakartaSans_700Bold' }}>Base Currency</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-6">
          <View className="flex-row space-x-2">
            {CURRENCIES.map((cur) => (
              <TouchableOpacity
                key={cur}
                onPress={() => setBaseCurrency(cur)}
                className={`px-5 py-2.5 rounded-full border ${baseCurrency === cur ? 'bg-[#0D9E75] border-[#0D9E75]' : 'bg-[#F4F6F9] border-gray-200'}`}
              >
                <Text className={baseCurrency === cur ? 'text-white font-bold text-[13px]' : 'text-[#6B7280] font-bold text-[13px]'} style={{ fontFamily: 'PlusJakartaSans_700Bold' }}>
                  {cur}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        <Text className="text-[#6B7280] text-[11px] font-bold uppercase tracking-widest mb-2" style={{ fontFamily: 'PlusJakartaSans_700Bold' }}>Monthly Budget ({baseCurrency})</Text>
        <TextInput
          className="bg-[#F4F6F9] border border-gray-200 rounded-[16px] p-4 mb-6 text-[#111827] font-bold text-[15px]"
          style={{ fontFamily: 'PlusJakartaSans_700Bold' }}
          placeholder="e.g. 500 (leave empty for none)"
          placeholderTextColor="#9CA3AF"
          keyboardType="decimal-pad"
          value={monthlyBudget}
          onChangeText={setMonthlyBudget}
        />

        <View className="flex-row items-center justify-between mb-6 bg-[#F4F6F9] p-4 rounded-[16px]">
          <View className="flex-1 pr-4">
            <Text className="text-[#111827] font-bold text-[15px] mb-1" style={{ fontFamily: 'PlusJakartaSans_700Bold' }}>Email Reminders</Text>
            <Text className="text-[#6B7280] text-[13px]" style={{ fontFamily: 'PlusJakartaSans_500Medium' }}>Get notified before renewals</Text>
          </View>
          <Switch
            value={emailReminders}
            onValueChange={setEmailReminders}
            trackColor={{ false: '#E5E7EB', true: '#1DCCA0' }}
            thumbColor={emailReminders ? '#0D9E75' : '#fff'}
          />
        </View>

        <TouchableOpacity
          onPress={saveServerSettings}
          disabled={savingSettings}
          className="bg-[#111827] py-4 rounded-[16px] items-center shadow-sm"
        >
          {savingSettings ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text className="text-white font-bold text-[13px] uppercase tracking-widest" style={{ fontFamily: 'PlusJakartaSans_700Bold' }}>Save Changes</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* ── Push Notifications ───────────────────────── */}
      <View className="bg-white p-6 rounded-[24px] shadow-sm mb-6 border border-gray-100 flex-row items-center justify-between">
        <View className="flex-row items-center space-x-4 flex-1">
          <View className="w-12 h-12 rounded-[16px] bg-[#FEF3C7] items-center justify-center">
            <Feather name="bell" size={20} color="#D97706" />
          </View>
          <View className="flex-1 pr-4">
            <Text className="text-[#111827] font-bold text-[15px] mb-1" style={{ fontFamily: 'PlusJakartaSans_700Bold' }}>Push Notifications</Text>
            <Text className="text-[#6B7280] text-[13px]" style={{ fontFamily: 'PlusJakartaSans_500Medium' }}>
              {arePushNotificationsAvailable()
                ? 'Notify 1 day before due'
                : 'Requires a dev build (not Expo Go)'}
            </Text>
          </View>
        </View>
        <Switch
          value={pushReminders}
          onValueChange={handleTogglePush}
          disabled={!arePushNotificationsAvailable()}
          trackColor={{ false: '#E5E7EB', true: '#FDE68A' }}
          thumbColor={pushReminders ? '#D97706' : '#fff'}
        />
      </View>

      {/* ── Category Budgets ─────────────────────────── */}
      <View className="bg-white p-6 rounded-[24px] shadow-sm mb-6 border border-gray-100">
        <View className="flex-row items-center space-x-3 mb-6">
          <Feather name="target" size={20} color="#0D9E75" />
          <Text className="text-[#111827] font-bold text-lg" style={{ fontFamily: 'PlusJakartaSans_700Bold' }}>Category Budgets</Text>
        </View>
        
        <View className="bg-[#F4F6F9] rounded-[16px] overflow-hidden">
          {CATEGORIES.map((cat, idx) => {
            const existing = categoryBudgets.find((b) => b.category === cat);
            const isEditing = editingBudget === cat;
            return (
              <View key={cat} className={`flex-row items-center justify-between p-4 ${idx !== CATEGORIES.length - 1 ? 'border-b border-gray-200' : ''}`}>
                <Text className="text-[#111827] font-bold text-[13px]" style={{ fontFamily: 'PlusJakartaSans_700Bold' }}>{cat}</Text>
                {isEditing ? (
                  <View className="flex-row items-center space-x-3">
                    <TextInput
                      className="bg-white border border-[#0D9E75] rounded-lg px-3 py-1.5 text-[#111827] font-bold text-[13px] w-24"
                      style={{ fontFamily: 'PlusJakartaSans_700Bold' }}
                      placeholder="Amount"
                      placeholderTextColor="#9CA3AF"
                      keyboardType="decimal-pad"
                      value={budgetInput}
                      onChangeText={setBudgetInput}
                      autoFocus
                    />
                    <TouchableOpacity onPress={() => saveCategoryBudget(cat)} className="w-8 h-8 bg-[#0D9E75] rounded-full items-center justify-center">
                      <Feather name="check" size={14} color="#FFF" />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => { setEditingBudget(null); setBudgetInput(''); }} className="w-8 h-8 bg-white border border-gray-300 rounded-full items-center justify-center">
                      <Feather name="x" size={14} color="#6B7280" />
                    </TouchableOpacity>
                  </View>
                ) : (
                  <TouchableOpacity
                    onPress={() => {
                      setEditingBudget(cat);
                      setBudgetInput(existing ? String(Number(existing.limit).toFixed(0)) : '');
                    }}
                    className="flex-row items-center space-x-2"
                  >
                    <Text className={existing ? 'text-[#0D9E75] text-[13px] font-bold' : 'text-[#6B7280] text-[13px] font-bold'} style={{ fontFamily: 'PlusJakartaSans_700Bold' }}>
                      {existing ? `${baseCurrency} ${Number(existing.limit).toFixed(0)}` : 'Set limit'}
                    </Text>
                    <Feather name="edit-2" size={14} color={existing ? '#0D9E75' : '#9CA3AF'} />
                  </TouchableOpacity>
                )}
              </View>
            );
          })}
        </View>
      </View>

      {/* ── Import / Export ──────────────────────────── */}
      <View className="bg-white p-6 rounded-[24px] shadow-sm mb-6 border border-gray-100">
        <View className="flex-row items-center space-x-3 mb-6">
          <Feather name="download-cloud" size={20} color="#0D9E75" />
          <Text className="text-[#111827] font-bold text-lg" style={{ fontFamily: 'PlusJakartaSans_700Bold' }}>Export Data</Text>
        </View>
        <View className="flex-row space-x-4">
          <TouchableOpacity
            onPress={handleExportCSV}
            disabled={exporting}
            className="flex-1 flex-row items-center justify-center space-x-2 p-4 rounded-[16px] bg-[#1DCCA0]/10 border border-[#1DCCA0]/20"
          >
            <Feather name="file-text" size={18} color="#0D9E75" />
            <Text className="text-[#0D9E75] font-bold text-[13px]" style={{ fontFamily: 'PlusJakartaSans_700Bold' }}>Export CSV</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleExportPDF}
            className="flex-1 flex-row items-center justify-center space-x-2 p-4 rounded-[16px] bg-[#1DCCA0]/10 border border-[#1DCCA0]/20"
          >
            <Feather name="file" size={18} color="#0D9E75" />
            <Text className="text-[#0D9E75] font-bold text-[13px]" style={{ fontFamily: 'PlusJakartaSans_700Bold' }}>Export PDF</Text>
          </TouchableOpacity>
        </View>
        <Text className="text-[#9CA3AF] text-[11px] mt-4 text-center" style={{ fontFamily: 'PlusJakartaSans_500Medium' }}>
          Opens the export in your browser
        </Text>
      </View>

      {/* ── Log Out ──────────────────────────────────── */}
      <TouchableOpacity
        className="bg-white p-6 rounded-[24px] shadow-sm flex-row items-center justify-between mb-8 border border-[#FEE2E2]"
        onPress={handleLogout}
      >
        <View className="flex-row items-center space-x-4">
          <View className="w-10 h-10 rounded-full bg-[#FEF2F2] items-center justify-center">
            <Feather name="log-out" size={18} color="#DC2626" />
          </View>
          <Text className="text-[#DC2626] font-bold text-[15px]" style={{ fontFamily: 'PlusJakartaSans_700Bold' }}>Log Out</Text>
        </View>
        <Feather name="chevron-right" size={20} color="#DC2626" />
      </TouchableOpacity>
    </ScrollView>
  );
}
