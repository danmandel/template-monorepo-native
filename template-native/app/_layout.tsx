import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import 'react-native-reanimated';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AchievementBanner } from '@/components/AchievementBanner';
import { AddTodoModal } from '@/components/modals';
import { useColorScheme } from '@/components/useColorScheme';
import { Colors } from '@/constants/Colors';
import {
  AchievementBannerProvider,
  AddTodoModalProvider,
  ChatOverlayProvider,
  SchedulesProvider,
  SelectedDateProvider,
  StreakProvider,
  ThemeProvider as AppThemeProvider
} from '@/contexts';
import { ApolloProvider } from '@/lib/api';
import { SupabaseProvider } from '@/lib/supabase';

export { ErrorBoundary } from 'expo-router';

export const unstable_settings = {
  initialRouteName: '(drawer)'
};

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

// Refined theme configuration for Dail.ly
// Warm, elegant color palette with subtle depth
const DailyDashDarkTheme = {
  ...DarkTheme,
  dark: true,
  colors: {
    ...DarkTheme.colors,
    primary: Colors.dark.tint,
    background: Colors.dark.background,
    card: Colors.dark.backgroundSecondary,
    text: Colors.dark.text,
    border: Colors.dark.border,
    notification: Colors.dark.tint
  }
};

const DailyDashLightTheme = {
  ...DefaultTheme,
  dark: false,
  colors: {
    ...DefaultTheme.colors,
    primary: Colors.light.tint,
    background: Colors.light.background,
    card: Colors.light.backgroundSecondary,
    text: Colors.light.text,
    border: Colors.light.border,
    notification: Colors.light.tint
  }
};

export const RootLayout = () => {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf')
  });

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) SplashScreen.hideAsync();
  }, [loaded]);

  if (!loaded) return null;

  return <RootLayoutNav />;
};

const RootLayoutNav = () => {
  const colorScheme = useColorScheme();

  return (
    <AppThemeProvider>
      <SupabaseProvider>
        <ApolloProvider>
          <ChatOverlayProvider>
            <SelectedDateProvider>
              <SchedulesProvider>
                <StreakProvider>
                  <AchievementBannerProvider>
                    <AddTodoModalProvider>
                      <GestureHandlerRootView style={{ flex: 1 }}>
                        <SafeAreaProvider>
                          <ThemeProvider
                            value={
                              colorScheme === 'dark' ? DailyDashDarkTheme : DailyDashLightTheme
                            }
                          >
                            <Stack screenOptions={{ headerShown: false }}>
                              <Stack.Screen name='(drawer)' />
                              <Stack.Screen
                                name='compose'
                                options={{
                                  presentation: 'modal',
                                  headerShown: false
                                }}
                              />
                            </Stack>
                            <AddTodoModal />
                            <AchievementBanner />
                          </ThemeProvider>
                        </SafeAreaProvider>
                      </GestureHandlerRootView>
                    </AddTodoModalProvider>
                  </AchievementBannerProvider>
                </StreakProvider>
              </SchedulesProvider>
            </SelectedDateProvider>
          </ChatOverlayProvider>
        </ApolloProvider>
      </SupabaseProvider>
    </AppThemeProvider>
  );
};

export default RootLayout;
