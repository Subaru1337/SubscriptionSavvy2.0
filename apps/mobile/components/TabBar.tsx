import { View, Text, TouchableOpacity } from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function TabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <View 
      className="flex-row items-center justify-between px-2 bg-white border-t border-gray-100"
      style={{ paddingBottom: Math.max(insets.bottom, 12), paddingTop: 12 }}
    >
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        const label = options.title !== undefined ? options.title : route.name;
        
        const isFocused = state.index === index;

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
        if (route.name === 'subscriptions') iconName = 'play-circle'; // looks like a stack/play in design, we can use play-circle or layers
        if (route.name === 'calendar') iconName = 'calendar';
        if (route.name === 'settings') iconName = 'settings';
        
        // Match specific icons from the image:
        if (route.name === 'subscriptions') iconName = 'youtube'; // close to the media icon in the design
        
        return (
          <TouchableOpacity
            key={route.key}
            onPress={onPress}
            className={`flex-1 items-center justify-center py-2 mx-1 rounded-xl flex-col ${isFocused ? 'bg-[#0D7377]' : 'bg-transparent'}`}
          >
            <Feather 
              name={iconName as any} 
              size={20} 
              color={isFocused ? '#FFFFFF' : '#4B5563'} 
              style={{ marginBottom: 4 }}
            />
            <Text 
              className={`text-[10px] font-medium ${isFocused ? 'text-white' : 'text-gray-600'}`}
            >
              {label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}
