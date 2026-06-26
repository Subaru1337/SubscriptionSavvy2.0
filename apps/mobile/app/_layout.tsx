import "../global.css";
import { Stack } from "expo-router";
import { useEffect, useState } from "react";
import { useFonts } from "expo-font";
import { 
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold 
} from "@expo-google-fonts/plus-jakarta-sans";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";
import * as SplashScreen from "expo-splash-screen";
import { View, Animated } from "react-native";
import { useVideoPlayer, VideoView } from "expo-video";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [animationFinished, setAnimationFinished] = useState(false);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const [fontsLoaded] = useFonts({
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
  });

  const player = useVideoPlayer(require('../assets/splash.mp4'), player => {
    player.loop = false;
    player.play();
  });

  useEffect(() => {
    const subscription = player.addListener('playingChange', ({ isPlaying }) => {
      if (!isPlaying && player.currentTime > 0) {
        // Fade out smoothly over 1.5 seconds
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 1500,
          useNativeDriver: true,
        }).start(() => setAnimationFinished(true));
      }
    });
    return () => subscription.remove();
  }, [player, fadeAnim]);

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <BottomSheetModalProvider>
        <Stack>
          <Stack.Screen name="index" options={{ title: "Login", headerShown: false }} />
          <Stack.Screen name="register" options={{ title: "Register", headerShown: false }} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen 
            name="add-subscription" 
            options={{ 
              presentation: 'transparentModal', 
              animation: 'fade', 
              headerShown: false 
            }} 
          />
          <Stack.Screen name="subscription/[id]" options={{ title: 'Subscription Detail', headerStyle: { backgroundColor: '#FFFFFF' }, headerTintColor: '#1A1A1A' }} />
        </Stack>

        {!animationFinished && (
          <Animated.View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: '#F4F6F9', alignItems: 'center', justifyContent: 'center', zIndex: 9999, opacity: fadeAnim }}>
            <VideoView
              player={player}
              style={{ width: '100%', height: '100%' }}
              contentFit="cover"
              nativeControls={false}
            />
          </Animated.View>
        )}
      </BottomSheetModalProvider>
    </GestureHandlerRootView>
  );
}
