import { useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import Animated, { useAnimatedStyle, withSpring, useSharedValue } from 'react-native-reanimated';
import { useRouter } from 'expo-router';

const AnimatedFeather = Animated.createAnimatedComponent(Feather);

function TabIcon({ isFocused, iconName, label }: { isFocused: boolean, iconName: string, label: string }) {
  const scale = useSharedValue(1);

  useEffect(() => {
    if (isFocused) {
      scale.value = withSpring(1.2, { damping: 10, stiffness: 100 }, () => {
        scale.value = withSpring(1);
      });
    }
  }, [isFocused]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }]
  }));

  return (
    <View className="items-center justify-center pt-2 pb-1">
      <AnimatedFeather 
        name={iconName as any} 
        size={22} 
        color={isFocused ? '#0D7377' : '#6B7280'} 
        style={animatedStyle}
      />
      {isFocused && (
        <View className="w-1.5 h-1.5 rounded-full bg-[#0D7377] mt-1 absolute bottom-0" />
      )}
    </View>
  );
}

export default function TabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  // Filter out the settings tab explicitly
  const visibleRoutes = state.routes.filter(r => r.name !== 'settings');

  // We will insert the FAB in the middle (index 2)
  const tabsWithFab = [
    ...visibleRoutes.slice(0, 2),
    { key: 'FAB', name: 'FAB' },
    ...visibleRoutes.slice(2)
  ];

  return (
    <View 
      style={{ 
        position: 'absolute', 
        bottom: Math.max(insets.bottom, 16), 
        left: 20, 
        right: 20,
        borderRadius: 999,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.1,
        shadowRadius: 20,
        elevation: 10,
      }}
    >
      <BlurView intensity={80} tint="light" style={styles.blurContainer}>
        {tabsWithFab.map((route: any, index) => {
          if (route.name === 'FAB') {
            return (
              <TouchableOpacity
                key="FAB"
                onPress={() => router.push('/add-subscription')}
                style={styles.fabContainer}
              >
                <View style={styles.fabInner}>
                  <Feather name="plus" size={24} color="#FFFFFF" />
                </View>
              </TouchableOpacity>
            );
          }

          // Original route logic
          // Find the actual index in the state.routes array
          const routeIndex = state.routes.findIndex(r => r.key === route.key);
          const { options } = descriptors[route.key];
          const label = options.title !== undefined ? options.title : route.name;
          const isFocused = state.index === routeIndex;

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name, route.params);
            }
          };

          let iconName = 'circle';
          if (route.name === 'index') iconName = 'grid';
          if (route.name === 'subscriptions') iconName = 'list'; 
          if (route.name === 'analytics') iconName = 'pie-chart';
          if (route.name === 'calendar') iconName = 'calendar';
          if (route.name === 'settings') iconName = 'settings';
          
          return (
            <TouchableOpacity
              key={route.key}
              onPress={onPress}
              className="flex-1 items-center justify-center"
            >
              <TabIcon isFocused={isFocused} iconName={iconName} label={label} />
            </TouchableOpacity>
          );
        })}
      </BlurView>
    </View>
  );
}

const styles = StyleSheet.create({
  blurContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    height: 64,
  },
  fabContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fabInner: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#0D7377',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0D7377',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  }
});
