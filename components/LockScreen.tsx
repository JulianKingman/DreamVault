import React, { useEffect } from 'react';
import { YStack, Text, Button } from 'tamagui';
import { Lock } from '@tamagui/lucide-icons';
import { useAuth } from '../contexts/AuthContext';

export function LockScreen() {
  const { authenticate, isFirstLaunch } = useAuth();

  useEffect(() => {
    authenticate();
  }, [authenticate]);

  return (
    <YStack
      position="absolute"
      top={0}
      left={0}
      right={0}
      bottom={0}
      backgroundColor="$background"
      alignItems="center"
      justifyContent="center"
      space="$6"
      zIndex={999}
    >
      <Lock size={64} color="$gray10" />
      <Text fontSize="$7" fontWeight="bold">
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
