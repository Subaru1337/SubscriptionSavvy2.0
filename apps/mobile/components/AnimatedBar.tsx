import React, { useEffect } from 'react';
import { View, Text } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming, Easing, withDelay } from 'react-native-reanimated';

export default function AnimatedBar({ value, maxValue, label, delay = 0, isCurrentMonth = false, currencySymbol = '₹' }: { value: number, maxValue: number, label: string, delay?: number, isCurrentMonth?: boolean, currencySymbol?: string }) {
  const height = useSharedValue(0);
  
  useEffect(() => {
    const targetHeight = maxValue > 0 ? Math.max((value / maxValue) * 100, 4) : 4;
    height.value = withDelay(delay, withTiming(targetHeight, {
      duration: 1000,
      easing: Easing.out(Easing.cubic),
    }));
  }, [value, maxValue]);

  const rStyle = useAnimatedStyle(() => {
    return {
      height: `${height.value}%`,
    };
  });

  return (
    <View className="items-center flex-1 justify-end h-full">
      {value > 0 && (
        <Text className="text-[9px] font-bold text-[#6B7280] mb-1.5" style={{ fontFamily: 'PlusJakartaSans_700Bold' }}>{currencySymbol}{value.toFixed(0)}</Text>
      )}
      <View className="w-full max-w-[28px] bg-[#F4F6F9] rounded-t-lg h-full absolute bottom-6" style={{ zIndex: -1 }} />
      <Animated.View 
        className={`w-full max-w-[28px] rounded-t-lg mb-6 ${isCurrentMonth ? 'bg-[#0D9E75]' : 'bg-[#1DCCA0]'}`} 
        style={[rStyle, { opacity: isCurrentMonth ? 1 : 0.6 }]} 
      />
      <Text className={`text-[10px] uppercase tracking-wider absolute bottom-0 ${isCurrentMonth ? 'text-[#0D9E75] font-bold' : 'text-[#9CA3AF] font-bold'}`} style={{ fontFamily: 'PlusJakartaSans_700Bold' }}>
        {label}
      </Text>
    </View>
  );
}
