import { View, Text, TextInput, TouchableOpacity, SafeAreaView } from "react-native";
import { useState } from "react";
import { router } from "expo-router";

export default function AuthScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = () => {
    // For demo purposes, we will just navigate to tabs
    router.replace("/(tabs)");
  };

  return (
    <SafeAreaView className="flex-1 bg-base justify-center">
      <View className="p-8">
        <Text className="text-4xl font-bold text-text mb-2">Welcome</Text>
        <Text className="text-muted mb-8">Sign in to SubscriptionSavvy</Text>

        <View className="space-y-4 mb-6">
          <View>
            <Text className="text-xs font-bold text-muted uppercase mb-2">Email</Text>
            <TextInput
              className="bg-surface-2 border border-black/5 rounded-xl p-4 text-text"
              placeholder="you@example.com"
              placeholderTextColor="#6B6560"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />
          </View>
          
          <View className="mt-4">
            <Text className="text-xs font-bold text-muted uppercase mb-2">Password</Text>
            <TextInput
              className="bg-surface-2 border border-black/5 rounded-xl p-4 text-text"
              placeholder="Min 8 characters"
              placeholderTextColor="#6B6560"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
          </View>
        </View>

        <TouchableOpacity 
          onPress={handleLogin}
          className="bg-amber rounded-xl p-4 items-center mb-4 mt-6"
        >
          <Text className="text-black font-bold text-lg">Sign In</Text>
        </TouchableOpacity>
        
        <TouchableOpacity className="items-center">
          <Text className="text-amber font-medium">Create an account</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
