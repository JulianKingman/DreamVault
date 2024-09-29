import React, { useEffect } from 'react';
import 'expo-dev-client';
import { Stack } from 'expo-router';
import { TamaguiProvider, Theme } from 'tamagui';
import { useFonts } from 'expo-font';
import { SafeAreaView, StyleSheet, useColorScheme, View } from 'react-native';
import { Plus } from '@tamagui/lucide-icons';
import { useRouter, usePathname } from 'expo-router';
import '../tamagui-web.css';
import config from '../tamagui.config';
import { initDatabase } from '../utils/database';
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from '@react-navigation/native';

export default function RootLayout() {
  const [loaded] = useFonts({
    Inter: require('@tamagui/font-inter/otf/Inter-Medium.otf'),
    InterBold: require('@tamagui/font-inter/otf/Inter-Bold.otf'),
  });

  const colorScheme = useColorScheme();

  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    initDatabase();
  }, []);

  if (!loaded) {
    return null;
  }

  return (
    <TamaguiProvider config={config} defaultTheme={colorScheme ?? 'light'}>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <Theme name={colorScheme ?? 'light'}>
          <Stack>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen
              name="new-dream"
              options={{ presentation: 'modal', title: 'New Dream Entry' }}
            />
            <Stack.Screen name="view-dream" options={{ title: 'View Dream' }} />
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
