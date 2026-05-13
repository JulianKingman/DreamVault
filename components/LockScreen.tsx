import React, { useEffect, useState, useCallback } from 'react';
import { YStack, Text, Button, Spinner } from 'tamagui';
import { Lock } from '@tamagui/lucide-icons';
import { useAuth } from '../contexts/AuthContext';
import type { AuthResult } from '../contexts/AuthContext';

type Status = 'idle' | 'scanning' | 'error';

function describeFailure(result: AuthResult): string {
  if (result.ok) return '';
  switch (result.reason) {
    case 'no-key':
      return 'Authentication was cancelled or failed. Tap to try again.';
    case 'init-failed':
      return 'Could not unlock the database. Tap to retry.';
    case 'in-progress':
      return '';
  }
}

export function LockScreen() {
  const { authenticate, isFirstLaunch } = useAuth();
  const [status, setStatus] = useState<Status>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const runAuth = useCallback(async () => {
    setStatus('scanning');
    setErrorMessage(null);
    const result = await authenticate();
    if (result.ok) {
      // The layout will swap us out via isAuthenticated; nothing else to do.
      return;
    }
    if (result.reason === 'in-progress') {
      // Another call is already running; stay scanning until it finishes.
      return;
    }
    setStatus('error');
    setErrorMessage(describeFailure(result));
  }, [authenticate]);

  // Trigger biometric auth as soon as the lock screen mounts.
  useEffect(() => {
    runAuth();
  }, [runAuth]);

  const scanning = status === 'scanning';

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
        Dream Locket
      </Text>
      <Text fontSize="$4" color="$gray10" textAlign="center" paddingHorizontal="$6">
        {isFirstLaunch
          ? 'Set up biometric protection for your dreams'
          : scanning
            ? 'Authenticating…'
            : errorMessage ?? 'Authenticate to access your dreams'}
      </Text>
      <Button
        size="$5"
        theme="active"
        onPress={runAuth}
        disabled={scanning}
        icon={scanning ? <Spinner size="small" /> : undefined}
      >
        {scanning ? 'Scanning' : status === 'error' ? 'Try again' : 'Unlock'}
      </Button>
    </YStack>
  );
}
