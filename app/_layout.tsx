import React, { useEffect } from 'react';
import 'expo-dev-client';
import { Stack } from 'expo-router';
import { TamaguiProvider, Theme, YStack } from 'tamagui';
import { useFonts } from 'expo-font';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Plus } from '@tamagui/lucide-icons';
import { useRouter, usePathname } from 'expo-router';
import { ThemeProvider } from '@react-navigation/core';
import '../tamagui-web.css';
import config from '../tamagui.config';
import { initDatabase } from '../utils/database';
import {
  DarkTheme,
  DefaultTheme,
} from '@react-navigation/native';
import type { Theme as NavTheme } from '@react-navigation/native';
import { ThemeProvider as AppThemeProvider, useTheme } from '../contexts/ThemeContext';

const MidnightNavTheme: NavTheme = {
  dark: true,
  colors: {
    primary: 'hsl(358, 80%, 38%)',
    background: 'hsl(0, 25%, 3%)',
    card: 'hsl(0, 20%, 5%)',
    text: 'hsl(0, 50%, 40%)',
    border: 'hsl(0, 25%, 10%)',
    notification: 'hsl(358, 85%, 42%)',
  },
  fonts: DarkTheme.fonts,
};
import { AuthProvider, useAuth } from '../contexts/AuthContext';
import { SyncProvider } from '../contexts/SyncContext';
import { LockScreen } from '../components/LockScreen';
import { useAutoSync } from '../hooks/useSync';

function RootLayoutInner() {
  const { resolvedTheme } = useTheme();
  const { isAuthenticated, isAuthEnabled } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useAutoSync();

  useEffect(() => {
    initDatabase();
  }, []);

  return (
    <TamaguiProvider config={config} defaultTheme={resolvedTheme}>
      <ThemeProvider value={
        resolvedTheme === 'midnight'
          ? MidnightNavTheme
          : resolvedTheme === 'dark'
            ? DarkTheme
            : DefaultTheme
      }>
        <Theme name={resolvedTheme}>
          <Stack>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen
              name="new-dream"
              options={{ presentation: 'modal', title: 'New Dream Entry' }}
            />
            <Stack.Screen name="view-dream" options={{ title: 'View Dream' }} />
            <Stack.Screen
              name="import-review"
              options={{ presentation: 'modal', title: 'Review Imports' }}
            />
          </Stack>
          {pathname !== '/settings' && (
            <YStack
              position="absolute"
              right={20}
              bottom={100}
            >
              <YStack
                backgroundColor="$blue9"
                borderRadius={30}
                padding={15}
                elevation={5}
                pressStyle={{ backgroundColor: '$blue10' }}
                onPress={() => router.push('/new-dream')}
              >
                <Plus color="white" size={24} />
              </YStack>
            </YStack>
          )}
          {isAuthEnabled && !isAuthenticated && <LockScreen />}
        </Theme>
      </ThemeProvider>
    </TamaguiProvider>
  );
}

export default function RootLayout() {
  const [loaded] = useFonts({
    Inter: require('@tamagui/font-inter/otf/Inter-Medium.otf'),
    InterBold: require('@tamagui/font-inter/otf/Inter-Bold.otf'),
  });

  if (!loaded) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AppThemeProvider>
        <AuthProvider>
          <SyncProvider>
            <RootLayoutInner />
          </SyncProvider>
        </AuthProvider>
      </AppThemeProvider>
    </GestureHandlerRootView>
  );
}
