import { GestureHandlerRootView } from 'react-native-gesture-handler';
import 'react-native-reanimated';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { ThemeProvider, DarkTheme, DefaultTheme } from '@react-navigation/native';
import { Stack, Redirect, usePathname } from 'expo-router';
import { useFonts } from 'expo-font';
import { useAppStore } from '@/stores/app';
import { useOnboardingStore } from '@/stores/onboarding';
import { useTheme } from '@/hooks/useTheme';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded] = useFonts({ SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf') });
  const hydrate = useAppStore((s) => s.hydrate);
  const isHydrated = useAppStore((s) => s.isHydrated);
  const isOnboarded = useOnboardingStore((s) => s.isComplete);
  const pathname = usePathname();
  const { isDark } = useTheme();

  useEffect(() => { hydrate(); }, [hydrate]);
  useEffect(() => { if (loaded) SplashScreen.hideAsync(); }, [loaded]);

  if (!loaded || !isHydrated) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  console.log('isOnboarded', isOnboarded, 'pathname', pathname);
  
  // Redirect to onboarding if not completed and not already there
  // if (!isOnboarded && !pathname?.startsWith('/onboarding')) {
  //   return (
  //     <GestureHandlerRootView style={{ flex: 1 }}>
  //       <ThemeProvider value={isDark ? DarkTheme : DefaultTheme}>
  //         <Redirect href="/onboarding" />
  //       </ThemeProvider>
  //     </GestureHandlerRootView>
  //   );
  // }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider value={isDark ? DarkTheme : DefaultTheme}>
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="+not-found" />
          <Stack.Screen name="onboarding/index" options={{ headerShown: false }} />
          <Stack.Screen name="modals/weekly-review" options={{ presentation: 'modal', title: 'Weekly Review' }} />
          <Stack.Screen name="modals/goal-detail" options={{ presentation: 'modal', title: 'Goal Details', animation: 'slide_from_left' }} />
        </Stack>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
