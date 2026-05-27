import {
  View, Text, TouchableOpacity, Alert, Switch, ScrollView,
  TextInput, ActivityIndicator, Linking
} from 'react-native';
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { Feather } from '@expo/vector-icons';
import { useEffect, useState, useCallback } from 'react';
import * as Notifications from 'expo-notifications';
import { api, API_URL } from '../../lib/api';

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

      const pushPerms = await Notifications.getPermissionsAsync();
      setPushReminders(pushPerms.granted || pushPerms.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL);

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
      Alert.alert('Saved', 'Your settings have been updated.');
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.error ?? 'Failed to save settings');
    } finally {
      setSavingSettings(false);
    }
  };

  const handleTogglePush = async (value: boolean) => {
    if (value) {
      const { status } = await Notifications.requestPermissionsAsync();
      if (status === 'granted') {
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
          router.replace('/');
        },
      },
    ]);
  };

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-background">
        <ActivityIndicator size="large" color="#0D7377" />
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-background" contentContainerStyle={{ padding: 16 }}>
      <Text className="text-2xl font-bold text-text-primary mb-4">Settings</Text>

      {/* ── Account ──────────────────────────────────── */}
      <View className="bg-card p-4 rounded-2xl border border-border mb-4">
        <View className="flex-row items-center space-x-3">
          <View className="w-12 h-12 rounded-full bg-[#E6F4FE] items-center justify-center">
            <Feather name="user" size={22} color="#0D7377" />
          </View>
          <View>
            <Text className="text-text-secondary text-xs">Logged in as</Text>
            <Text className="text-text-primary font-bold text-base">{email}</Text>
          </View>
        </View>
      </View>

      {/* ── Financial Settings ────────────────────────── */}
      <View className="bg-card p-4 rounded-2xl border border-border mb-4">
        <Text className="text-text-primary font-bold text-base mb-4">💰 Financial Settings</Text>

        <Text className="text-text-secondary text-xs mb-2">Base Currency</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4">
          <View className="flex-row space-x-2">
            {CURRENCIES.map((cur) => (
              <TouchableOpacity
                key={cur}
                onPress={() => setBaseCurrency(cur)}
                className={`px-3 py-2 rounded-full border ${baseCurrency === cur ? 'bg-primary border-primary' : 'bg-background border-border'}`}
              >
                <Text className={baseCurrency === cur ? 'text-white font-bold text-sm' : 'text-text-primary text-sm'}>
                  {cur}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        <Text className="text-text-secondary text-xs mb-1">Monthly Budget ({baseCurrency})</Text>
        <TextInput
          className="bg-background border border-border rounded-lg p-3 mb-4 text-text-primary"
          placeholder="e.g. 500 (leave empty for no budget)"
          placeholderTextColor="#9CA3AF"
          keyboardType="decimal-pad"
          value={monthlyBudget}
          onChangeText={setMonthlyBudget}
        />

        <View className="flex-row items-center justify-between mb-4">
          <View>
            <Text className="text-text-primary font-medium">Email Reminders</Text>
            <Text className="text-text-secondary text-xs">Get notified before renewals</Text>
          </View>
          <Switch
            value={emailReminders}
            onValueChange={setEmailReminders}
            trackColor={{ false: '#E8E2D9', true: '#0D7377' }}
          />
        </View>

        <TouchableOpacity
          onPress={saveServerSettings}
          disabled={savingSettings}
          className="bg-primary p-3 rounded-xl items-center"
        >
          {savingSettings ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text className="text-white font-bold">Save Financial Settings</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* ── Push Notifications ───────────────────────── */}
      <View className="bg-card p-4 rounded-xl border border-border mb-4">
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center space-x-3">
            <View className="w-10 h-10 rounded-full bg-orange-100 items-center justify-center">
              <Feather name="bell" size={18} color="#F59E0B" />
            </View>
            <View>
              <Text className="text-text-primary font-medium">Push Notifications</Text>
              <Text className="text-text-secondary text-xs">Notify 1 day before payment due</Text>
            </View>
          </View>
          <Switch
            value={pushReminders}
            onValueChange={handleTogglePush}
            trackColor={{ false: '#E8E2D9', true: '#0D7377' }}
          />
        </View>
      </View>

      {/* ── Category Budgets ─────────────────────────── */}
      <View className="bg-card p-4 rounded-2xl border border-border mb-4">
        <Text className="text-text-primary font-bold text-base mb-3">📂 Category Budgets</Text>
        <Text className="text-text-secondary text-xs mb-4">
          Set spending limits per category (in {baseCurrency})
        </Text>
        {CATEGORIES.map((cat) => {
          const existing = categoryBudgets.find((b) => b.category === cat);
          const isEditing = editingBudget === cat;
          return (
            <View key={cat} className="flex-row items-center justify-between py-2 border-b border-border last:border-0">
              <Text className="text-text-primary text-sm flex-1">{cat}</Text>
              {isEditing ? (
                <View className="flex-row items-center space-x-2">
                  <TextInput
                    className="bg-background border border-primary rounded-lg px-2 py-1 text-text-primary text-sm w-24"
                    placeholder="Amount"
                    placeholderTextColor="#9CA3AF"
                    keyboardType="decimal-pad"
                    value={budgetInput}
                    onChangeText={setBudgetInput}
                    autoFocus
                  />
                  <TouchableOpacity onPress={() => saveCategoryBudget(cat)}>
                    <Feather name="check" size={18} color="#0D7377" />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => { setEditingBudget(null); setBudgetInput(''); }}>
                    <Feather name="x" size={18} color="#6B6560" />
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity
                  onPress={() => {
                    setEditingBudget(cat);
                    setBudgetInput(existing ? String(Number(existing.limit).toFixed(0)) : '');
                  }}
                  className="flex-row items-center space-x-1"
                >
                  <Text className={existing ? 'text-primary text-sm font-medium' : 'text-text-secondary text-sm'}>
                    {existing ? `${baseCurrency} ${Number(existing.limit).toFixed(0)}` : 'Set limit'}
                  </Text>
                  <Feather name="edit-2" size={12} color="#6B6560" />
                </TouchableOpacity>
              )}
            </View>
          );
        })}
      </View>

      {/* ── Import / Export ──────────────────────────── */}
      <View className="bg-card p-4 rounded-2xl border border-border mb-4">
        <Text className="text-text-primary font-bold text-base mb-3">📤 Export Data</Text>
        <View className="flex-row space-x-3">
          <TouchableOpacity
            onPress={handleExportCSV}
            disabled={exporting}
            className="flex-1 flex-row items-center justify-center space-x-2 p-3 rounded-xl border border-primary"
          >
            <Feather name="file-text" size={16} color="#0D7377" />
            <Text className="text-primary font-medium">Export CSV</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleExportPDF}
            className="flex-1 flex-row items-center justify-center space-x-2 p-3 rounded-xl border border-primary"
          >
            <Feather name="file" size={16} color="#0D7377" />
            <Text className="text-primary font-medium">Export PDF</Text>
          </TouchableOpacity>
        </View>
        <Text className="text-text-secondary text-xs mt-2">
          Opens the export in your browser. Log in to the web app if prompted.
        </Text>
      </View>

      {/* ── Log Out ──────────────────────────────────── */}
      <TouchableOpacity
        className="bg-card p-4 rounded-xl border border-border flex-row items-center justify-between mb-8"
        onPress={handleLogout}
      >
        <View className="flex-row items-center space-x-3">
          <Feather name="log-out" size={20} color="#EF4444" />
          <Text className="text-overdue font-medium text-lg">Log Out</Text>
        </View>
        <Feather name="chevron-right" size={20} color="#EF4444" />
      </TouchableOpacity>
    </ScrollView>
  );
}
