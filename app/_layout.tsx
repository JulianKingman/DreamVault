import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { TamaguiProvider, Theme, YStack } from 'tamagui';
import { useFonts } from 'expo-font';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Plus } from '@tamagui/lucide-icons';
import { useRouter, usePathname } from 'expo-router';
import { ThemeProvider } from '@react-navigation/core';
import { LinearGradient } from 'expo-linear-gradient';
import '../tamagui-web.css';
import config from '../tamagui.config';
import {
  DarkTheme,
  DefaultTheme,
} from '@react-navigation/native';
import type { Theme as NavTheme } from '@react-navigation/native';
import { ThemeProvider as AppThemeProvider, useTheme } from '../contexts/ThemeContext';
import { getAccentGradient, getAccentForeground } from '../utils/themeColors';

// Navigation theme for Twilight (dark)
const TwilightNavTheme: NavTheme = {
  dark: true,
  colors: {
    primary: '#ffb77d',
    background: '#040e1f',
    card: '#02132c',
    text: '#dae6ff',
    border: 'rgba(33,72,125,0.15)',
    notification: '#ffb148',
  },
  fonts: DarkTheme.fonts,
};

// Navigation theme for Twilight Light (dawn pink)
const TwilightLightNavTheme: NavTheme = {
  dark: false,
  colors: {
    primary: '#c4623a',
    background: '#fdf6f4',
    card: '#f8eeeb',
    text: '#2a1f1b',
    border: 'rgba(160,120,110,0.2)',
    notification: '#c4623a',
  },
  fonts: DefaultTheme.fonts,
};

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

  const navTheme =
    resolvedTheme === 'midnight'
      ? MidnightNavTheme
      : resolvedTheme === 'light'
        ? TwilightLightNavTheme
        : TwilightNavTheme;

  if (!isAuthenticated) {
    return (
      <TamaguiProvider config={config} defaultTheme={resolvedTheme}>
        <ThemeProvider value={navTheme}>
          <Theme name={resolvedTheme}>
            <LockScreen />
          </Theme>
        </ThemeProvider>
      </TamaguiProvider>
    );
  }

  return (
    <TamaguiProvider config={config} defaultTheme={resolvedTheme}>
      <ThemeProvider value={navTheme}>
        <Theme name={resolvedTheme}>
          <Stack>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen
              name="new-dream"
              options={{ presentation: 'modal', title: 'New Dream Entry' }}
            />
            <Stack.Screen name="view-dream" options={{ headerShown: false }} />
            <Stack.Screen
              name="import"
              options={{ presentation: 'modal', title: 'Import Dreams' }}
            />
            <Stack.Screen
              name="import-review"
              options={{ presentation: 'modal', title: 'Review Imports' }}
            />
          </Stack>
          {pathname !== '/settings' && (
            <YStack
              position="absolute"
              right={20}
              bottom={170}
            >
              <LinearGradient
                colors={getAccentGradient(resolvedTheme)}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{
                  borderRadius: 30,
                  padding: 15,
                }}
              >
                <YStack
                  pressStyle={{ opacity: 0.8, scale: 0.95 }}
                  onPress={() => router.push('/new-dream')}
                >
                  <Plus color={getAccentForeground(resolvedTheme)} size={24} />
                </YStack>
              </LinearGradient>
            </YStack>
          )}
        </Theme>
      </ThemeProvider>
    </TamaguiProvider>
  );
}

export default function RootLayout() {
  const [loaded] = useFonts({
    // Plus Jakarta Sans (body/UI font)
    PlusJakartaSans_300Light: require('@expo-google-fonts/plus-jakarta-sans/300Light/PlusJakartaSans_300Light.ttf'),
    PlusJakartaSans_400Regular: require('@expo-google-fonts/plus-jakarta-sans/400Regular/PlusJakartaSans_400Regular.ttf'),
    PlusJakartaSans_500Medium: require('@expo-google-fonts/plus-jakarta-sans/500Medium/PlusJakartaSans_500Medium.ttf'),
    PlusJakartaSans_600SemiBold: require('@expo-google-fonts/plus-jakarta-sans/600SemiBold/PlusJakartaSans_600SemiBold.ttf'),
    PlusJakartaSans_700Bold: require('@expo-google-fonts/plus-jakarta-sans/700Bold/PlusJakartaSans_700Bold.ttf'),
    // Noto Serif (dream content display font)
    NotoSerif_400Regular: require('@expo-google-fonts/noto-serif/400Regular/NotoSerif_400Regular.ttf'),
    NotoSerif_700Bold: require('@expo-google-fonts/noto-serif/700Bold/NotoSerif_700Bold.ttf'),
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
