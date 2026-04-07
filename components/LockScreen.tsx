import React, { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import { YStack, Text, Button } from 'tamagui';
import { Lock } from '@tamagui/lucide-icons';
import { useAuth } from '../contexts/AuthContext';

export function LockScreen() {
  const { authenticate, isFirstLaunch } = useAuth();

  useEffect(() => {
    authenticate();
  }, [authenticate]);

  return (
    <YStack style={styles.container} alignItems="center" justifyContent="center" gap="$6">
      <Lock size={64} color="$gray10" />
      <Text fontSize="$7" fontWeight="bold" color="$gray12">
        Dream Vault
      </Text>
      <Text fontSize="$4" color="$gray10">
        {isFirstLaunch
          ? 'Set up biometric protection for your dreams'
          : 'Authenticate to access your dreams'}
      </Text>
      <Button size="$5" theme="active" onPress={authenticate}>
        Unlock
      </Button>
    </YStack>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000',
  },
});
