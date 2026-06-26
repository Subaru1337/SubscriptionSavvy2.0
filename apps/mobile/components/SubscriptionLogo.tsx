import React, { useState } from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';

const gradients = [
  ['#0D7377', '#0A7DB8'],
  ['#F59E0B', '#EF4444'],
  ['#8B5CF6', '#3B82F6'],
  ['#EC4899', '#8B5CF6'],
  ['#10B981', '#059669'],
];

export default function SubscriptionLogo({ name, size = 48, style }: { name: string, size?: number, style?: any }) {
  const [error, setError] = useState(false);
  const cleanName = name.toLowerCase().replace(/[^a-z0-9]/g, '');
  // Using logo.dev as requested (ensure you add your public key if required)
  const uri = `https://img.logo.dev/${cleanName}.com?token=pk_AdF4EF8GSh2d6xjUJdT4-A`;

  // Simple hash to pick a consistent gradient
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const colorIndex = Math.abs(hash) % gradients.length;
  const gradient = gradients[colorIndex];

  if (error) {
    return (
      <View style={[{ width: size, height: size, borderRadius: size / 4, backgroundColor: gradient[0], alignItems: 'center', justifyContent: 'center' }, style]}>
        <Text style={{ color: 'white', fontWeight: 'bold', fontSize: size * 0.4 }}>
          {name.charAt(0).toUpperCase()}
        </Text>
      </View>
    );
  }

  return (
    <Image
      source={{ uri }}
      style={[{ width: size, height: size, borderRadius: size / 4, backgroundColor: '#F4F6F9' }, style]}
      onError={() => setError(true)}
    />
  );
}
