import "../global.css";
import { Stack } from "expo-router";

export default function RootLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: "Login", headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="add-subscription" options={{ presentation: 'modal', title: 'Add Subscription', headerStyle: { backgroundColor: '#FFFFFF' }, headerTintColor: '#1A1A1A' }} />
      <Stack.Screen name="subscription/[id]" options={{ title: 'Subscription Detail', headerStyle: { backgroundColor: '#FFFFFF' }, headerTintColor: '#1A1A1A' }} />
    </Stack>
  );
}
