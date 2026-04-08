import React from 'react';
import { Stack } from 'expo-router';
import { TamaguiProvider, Theme } from 'tamagui';
import { useFonts } from 'expo-font';
import { StyleSheet, useColorScheme, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Plus } from '@tamagui/lucide-icons';
import { useRouter, usePathname } from 'expo-router';
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from '@react-navigation/native';
import '../tamagui-web.css';
import config from '../tamagui.config';
import { AuthProvider, useAuth } from '../contexts/AuthContext';
import { LockScreen } from '../components/LockScreen';

function AppContent() {
  const colorScheme = useColorScheme();
  const themeName = colorScheme ?? 'light';
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  if (!isAuthenticated) {
    return (
      <TamaguiProvider config={config} defaultTheme={themeName}>
        <Theme name={themeName}>
          <LockScreen />
        </Theme>
      </TamaguiProvider>
    );
  }

  return (
    <TamaguiProvider config={config} defaultTheme={themeName}>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <Theme name={themeName}>
          <Stack>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen
              name="new-dream"
              options={{ presentation: 'modal', title: 'New Dream Entry' }}
            />
            <Stack.Screen name="view-dream" options={{ title: 'View Dream' }} />
            <Stack.Screen
              name="import"
              options={{ presentation: 'modal', title: 'Import Dreams' }}
            />
            <Stack.Screen
              name="import-review"
              options={{ title: 'Review Import' }}
            />
          </Stack>
          {pathname !== '/settings' && (
            <View style={styles.fabContainer}>
              <Plus
                color="white"
                size={24}
                onPress={() => router.push('/new-dream')}
                style={styles.fabButton}
              />
            </View>
          )}
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
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  fabContainer: {
    position: 'absolute',
    right: 20,
    bottom: 100,
  },
  fabButton: {
    backgroundColor: '#A7C7E7',
    borderRadius: 30,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
});
