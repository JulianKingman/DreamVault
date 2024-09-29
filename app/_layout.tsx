import React, { useEffect } from 'react';
import 'expo-dev-client';
import { Stack } from 'expo-router';
import { TamaguiProvider, Theme, Button } from 'tamagui';
import config from '../tamagui.config';
import { useFonts } from 'expo-font';
import { SafeAreaView, StyleSheet, useColorScheme, View } from 'react-native';
import { Plus } from '@tamagui/lucide-icons';
import { useRouter, usePathname } from 'expo-router';
import '../tamagui-web.css';
import { tamaguiConfig } from '../tamagui.config';
import { initDatabase } from '../utils/database';

export default function RootLayout() {
  const [loaded] = useFonts({
    Inter: require('@tamagui/font-inter/otf/Inter-Medium.otf'),
    InterBold: require('@tamagui/font-inter/otf/Inter-Bold.otf'),
  });

  const colorScheme = useColorScheme();

  const router = useRouter();
  const pathname = usePathname();

  if (!loaded) {
    return null;
  }

  useEffect(() => {
    initDatabase();
  }, []);

  return (
    <TamaguiProvider config={tamaguiConfig} defaultTheme={colorScheme}>
      <Theme name={colorScheme}>
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen
            name="new-entry"
            options={{ presentation: 'modal', title: 'New Dream Entry' }}
          />
        </Stack>
        {pathname !== '/settings' && (
          <View style={styles.fabContainer}>
            <Button
              icon={<Plus color="white" />}
              circular
              size="$6"
              onPress={() => router.push('/new-entry')}
              backgroundColor="#A7C7E7" // Pastel blue color
              style={styles.fabButton}
            />
          </View>
        )}
      </Theme>
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
