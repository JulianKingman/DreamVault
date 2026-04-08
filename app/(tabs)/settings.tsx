import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  SafeAreaView,
  Linking,
  Alert,
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
import { encryptAllDreams } from '../../utils/database';
import { isEncryptionAvailable } from '../../utils/crypto';

export default function SettingsScreen() {
  const { themeMode, setThemeMode } = useTheme();
  const { isAuthEnabled, setAuthEnabled } = useAuth();
  const { syncStatus, lastSyncTime, cloudAvailable, syncNow, checkCloudAvailability } = useSync();
  const [hasBiometrics, setHasBiometrics] = useState(false);
  const [hasEncryption, setHasEncryption] = useState(false);
  const [encrypting, setEncrypting] = useState(false);
  const { available: aiAvailable } = useAI();
  const router = useRouter();

  useEffect(() => {
    LocalAuthentication.hasHardwareAsync().then(setHasBiometrics);
    checkCloudAvailability();
    isEncryptionAvailable().then(setHasEncryption);
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

  const handleEncryptAll = async () => {
    Alert.alert(
      'Encrypt Dreams',
      'This will encrypt all unencrypted dream content. Your device biometrics will be required to access your dreams. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Encrypt',
          onPress: async () => {
            setEncrypting(true);
            try {
              const count = await encryptAllDreams();
              Alert.alert('Done', `Encrypted ${count} dream(s).`);
            } catch (e: any) {
              Alert.alert('Error', e.message ?? 'Failed to encrypt dreams.');
            } finally {
              setEncrypting(false);
            }
          },
        },
      ]
    );
  };

  const handleImportFromNotes = () => {
    router.push('/import-review' as any);
  };

  const handleContribute = () => {
    Linking.openURL('https://github.com/yourusername/dream-journal-app');
  };

  const formatLastSync = () => {
    if (!lastSyncTime) return 'Never';
    return lastSyncTime.toLocaleString();
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView>
        <YStack space="$4" style={styles.container}>
          <Text fontSize="$8" fontWeight="bold" mb="$4">
            Settings
          </Text>

          <SettingsGroup title="Appearance">
            <SettingsItem
              icon={<Sun size={20} />}
              title="Light"
              onPress={() => setThemeMode('light')}
              right={
                <XStack
                  width={20}
                  height={20}
                  borderRadius={10}
                  borderWidth={2}
                  borderColor={themeMode === 'light' ? '$blue9' : '$gray7'}
                  backgroundColor={themeMode === 'light' ? '$blue9' : 'transparent'}
                />
              }
            />
            <SettingsItem
              icon={<Moon size={20} />}
              title="Dark"
              onPress={() => setThemeMode('dark')}
              right={
                <XStack
                  width={20}
                  height={20}
                  borderRadius={10}
                  borderWidth={2}
                  borderColor={themeMode === 'dark' ? '$blue9' : '$gray7'}
                  backgroundColor={themeMode === 'dark' ? '$blue9' : 'transparent'}
                />
              }
            />
            <SettingsItem
              icon={<Sunset size={20} color="$red9" />}
              title="Midnight"
              onPress={() => setThemeMode('midnight')}
              right={
                <XStack
                  width={20}
                  height={20}
                  borderRadius={10}
                  borderWidth={2}
                  borderColor={themeMode === 'midnight' ? '$red9' : '$gray7'}
                  backgroundColor={themeMode === 'midnight' ? '$red9' : 'transparent'}
                />
              }
            />
          </SettingsGroup>

          {hasBiometrics && (
            <SettingsGroup title="Security">
              <SettingsItem
                icon={<Shield size={20} />}
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

          {hasEncryption && (
            <SettingsGroup title="Encryption">
              <SettingsItem
                icon={<Lock size={20} />}
                title="Encrypt existing dreams"
                right={
                  encrypting ? (
                    <Spinner size="small" />
                  ) : (
                    <Button size="$3" onPress={handleEncryptAll}>
                      Encrypt
                    </Button>
                  )
                }
              />
              <XStack paddingHorizontal="$4" paddingBottom="$3">
                <Text fontSize="$2" color="$gray10">
                  AES-256-GCM encryption with biometric-protected keys. Post-quantum Kyber KEM wrapping for iCloud sync.
                </Text>
              </XStack>
            </SettingsGroup>
          )}

          <SettingsGroup title="Sync">
            <SettingsItem
              icon={<Cloud size={20} />}
              title="iCloud Sync"
              right={
                <Text color="$gray10" fontSize="$3">
                  {cloudAvailable ? 'Available' : 'Unavailable'}
                </Text>
              }
            />
            <SettingsItem
              icon={<RefreshCw size={20} />}
              title="Sync Now"
              onPress={cloudAvailable ? syncNow : undefined}
              right={
                syncStatus === 'syncing' ? (
                  <Spinner size="small" />
                ) : (
                  <Text color="$gray10" fontSize="$3">
                    {formatLastSync()}
                  </Text>
                )
              }
            />
          </SettingsGroup>

          <SettingsGroup title="Data">
            <SettingsItem
              icon={<Import size={20} />}
              title="Import from Notes"
              onPress={handleImportFromNotes}
            />
          </SettingsGroup>

          {aiAvailable && (
            <SettingsGroup title="AI Features">
              <SettingsItem
                icon={<Sparkles size={20} />}
                title="On-Device AI"
                right={
                  <Text color="$gray10" fontSize="$3">
                    Active
                  </Text>
                }
              />
              <XStack paddingHorizontal="$4" paddingBottom="$3">
                <Text fontSize="$2" color="$gray10">
                  Dream analysis, tag suggestions, and pattern recognition powered by Apple Intelligence. All processing happens on-device.
                </Text>
              </XStack>
            </SettingsGroup>
          )}

          <SettingsGroup title="About">
            <SettingsItem
              icon={<Github size={20} />}
              title="Contribute"
              onPress={handleContribute}
              right={<ExternalLink size={16} />}
            />
            <SettingsItem
              icon={<Info size={20} />}
              title="App Version"
              right={<Text color="$gray10">1.0.0</Text>}
            />
          </SettingsGroup>
        </YStack>
      </ScrollView>
    </SafeAreaView>
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
    <YStack space="$2" mb="$4">
      <Text fontSize="$5" fontWeight="bold" color="$gray11">
        {title}
      </Text>
      <YStack backgroundColor="$background" borderRadius="$4">
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
      space="$3"
      paddingVertical="$3"
      paddingHorizontal="$4"
      pressStyle={{ opacity: 0.8 }}
      onPress={onPress}
    >
      {icon}
      <Text flex={1}>{title}</Text>
      {right}
    </XStack>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
    padding: 20,
  },
});
