import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  SafeAreaView,
  Linking,
  Alert,
  View,
} from 'react-native';
import {
  Text,
  YStack,
  Switch,
  XStack,
  ScrollView,
  Spinner,
  Button,
} from 'tamagui';
import {
  Import,
  Github,
  Moon,
  Sun,
  Sunset,
  Clock,
  Info,
  ExternalLink,
  Shield,
  Cloud,
  RefreshCw,
  Lock,
  Sparkles,
} from '@tamagui/lucide-icons';
import * as LocalAuthentication from 'expo-local-authentication';
import { useRouter } from 'expo-router';
import { useTheme } from '../../contexts/ThemeContext';
import { useAI } from '../../hooks/useAI';
import { useAuth } from '../../contexts/AuthContext';
import { useSync } from '../../contexts/SyncContext';
import { AtmosphericBackground } from '../../components/AtmosphericBackground';

const RESOLVED_THEME_LABEL: Record<string, string> = {
  light: 'Light',
  dark: 'Twilight',
  midnight: 'Midnight',
};

export default function SettingsScreen() {
  const { themeMode, resolvedTheme, setThemeMode } = useTheme();
  const { isAuthEnabled, setAuthEnabled } = useAuth();
  const { syncStatus, lastSyncTime, cloudAvailable, syncNow, checkCloudAvailability } = useSync();
  const [hasBiometrics, setHasBiometrics] = useState(false);
  const { available: aiAvailable } = useAI();
  const router = useRouter();

  useEffect(() => {
    LocalAuthentication.hasHardwareAsync().then(setHasBiometrics);
    checkCloudAvailability();
  }, []);

  const handleAuthToggle = async (enabled: boolean) => {
    if (enabled) {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Authenticate to enable Face ID',
      });
      if (result.success) {
        setAuthEnabled(true);
      }
    } else {
      setAuthEnabled(false);
    }
  };

  const handleImportFromNotes = () => {
    router.push('/import' as any);
  };

  const handleContribute = () => {
    Linking.openURL('https://github.com/yourusername/dream-journal-app');
  };

  const formatLastSync = () => {
    if (!lastSyncTime) return 'Never';
    return lastSyncTime.toLocaleString();
  };

  return (
    <View style={styles.container}>
      <AtmosphericBackground />
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <YStack gap="$4" padding={20}>
            <Text fontFamily="$heading" fontSize="$8" fontWeight="bold" marginBottom="$4" color="$color">
              Settings
            </Text>

            <SettingsGroup title="Appearance">
              <SettingsItem
                icon={<Sun size={20} color="$gray10" />}
                title="Light"
                onPress={() => setThemeMode('light')}
                right={<RadioDot selected={themeMode === 'light'} />}
              />
              <SettingsItem
                icon={<Moon size={20} color="$gray10" />}
                title="Twilight"
                onPress={() => setThemeMode('dark')}
                right={<RadioDot selected={themeMode === 'dark'} color="$accentBackground" />}
              />
              <SettingsItem
                icon={<Sunset size={20} color="$red9" />}
                title="Midnight"
                onPress={() => setThemeMode('midnight')}
                right={<RadioDot selected={themeMode === 'midnight'} color="$red9" />}
              />
              <SettingsItem
                icon={<Clock size={20} color="$gray10" />}
                title="Auto"
                onPress={() => setThemeMode('auto')}
                right={
                  <XStack alignItems="center" gap="$2">
                    {themeMode === 'auto' && (
                      <Text color="$gray10" fontSize="$3" fontFamily="$body">
                        {RESOLVED_THEME_LABEL[resolvedTheme]}
                      </Text>
                    )}
                    <RadioDot selected={themeMode === 'auto'} />
                  </XStack>
                }
              />
            </SettingsGroup>

            {hasBiometrics && (
              <SettingsGroup title="Security">
                <SettingsItem
                  icon={<Shield size={20} color="$gray10" />}
                  title="Face ID / Biometrics"
                  right={
                    <Switch
                      size="$4"
                      checked={isAuthEnabled}
                      onCheckedChange={handleAuthToggle}
                      native
                    />
                  }
                />
              </SettingsGroup>
            )}

            <SettingsGroup title="Encryption">
              <SettingsItem
                icon={<Lock size={20} color="$gray10" />}
                title="Encryption"
                right={<Text color="$gray10" fontSize="$3" fontFamily="$body">AES-256 (Always On)</Text>}
              />
              <XStack paddingHorizontal="$4" paddingBottom="$3">
                <Text fontSize="$2" color="$gray10" fontFamily="$body">
                  Your dream journal is encrypted on-device with AES-256 via SQLCipher.
                  Biometric authentication is required to access your data.
                </Text>
              </XStack>
            </SettingsGroup>

            <SettingsGroup title="Sync">
              <SettingsItem
                icon={<Cloud size={20} color="$gray10" />}
                title="iCloud Sync"
                right={
                  <Text color="$gray10" fontSize="$3" fontFamily="$body">
                    {cloudAvailable ? 'Available' : 'Unavailable'}
                  </Text>
                }
              />
              <SettingsItem
                icon={<RefreshCw size={20} color="$gray10" />}
                title="Sync Now"
                onPress={cloudAvailable ? syncNow : undefined}
                right={
                  syncStatus === 'syncing' ? (
                    <Spinner size="small" />
                  ) : (
                    <Text color="$gray10" fontSize="$3" fontFamily="$body">
                      {formatLastSync()}
                    </Text>
                  )
                }
              />
            </SettingsGroup>

            <SettingsGroup title="Data">
              <SettingsItem
                icon={<Import size={20} color="$gray10" />}
                title="Import Dreams"
                onPress={handleImportFromNotes}
              />
            </SettingsGroup>

            {aiAvailable && (
              <SettingsGroup title="AI Features">
                <SettingsItem
                  icon={<Sparkles size={20} color="$gray10" />}
                  title="On-Device AI"
                  right={
                    <Text color="$accentBackground" fontSize="$3" fontFamily="$body" fontWeight="600">
                      Active
                    </Text>
                  }
                />
                <XStack paddingHorizontal="$4" paddingBottom="$3">
                  <Text fontSize="$2" color="$gray10" fontFamily="$body">
                    Dream analysis and tag suggestions powered by Apple Intelligence. All processing happens on-device.
                  </Text>
                </XStack>
              </SettingsGroup>
            )}

            <SettingsGroup title="About">
              <SettingsItem
                icon={<Github size={20} color="$gray10" />}
                title="Contribute"
                onPress={handleContribute}
                right={<ExternalLink size={16} color="$gray10" />}
              />
              <SettingsItem
                icon={<Info size={20} color="$gray10" />}
                title="App Version"
                right={<Text color="$gray10" fontFamily="$body">1.0.0</Text>}
              />
            </SettingsGroup>
          </YStack>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

function RadioDot({ selected, color = '$accentBackground' }: { selected: boolean; color?: string }) {
  return (
    <XStack
      width={20}
      height={20}
      borderRadius={10}
      borderWidth={2}
      borderColor={selected ? color : '$gray7'}
      backgroundColor={selected ? color : 'transparent'}
    />
  );
}

function SettingsGroup({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <YStack gap="$2" marginBottom="$2">
      <Text
        fontSize="$2"
        fontWeight="600"
        color="$gray10"
        fontFamily="$body"
        letterSpacing={1.5}
        textTransform="uppercase"
      >
        {title}
      </Text>
      <YStack backgroundColor="$backgroundStrong" borderRadius={20}>
        {children}
      </YStack>
    </YStack>
  );
}

function SettingsItem({
  icon,
  title,
  onPress,
  right,
}: {
  icon: React.ReactNode;
  title: string;
  onPress?: () => void;
  right?: React.ReactNode;
}) {
  return (
    <XStack
      alignItems="center"
      gap="$3"
      paddingVertical="$3"
      paddingHorizontal="$4"
      pressStyle={{ opacity: 0.7 }}
      onPress={onPress}
    >
      {icon}
      <Text flex={1} fontFamily="$body" color="$color">{title}</Text>
      {right}
    </XStack>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 120,
  },
});
