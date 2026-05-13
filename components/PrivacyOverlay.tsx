import React from 'react';
import { YStack, Text } from 'tamagui';
import { Lock } from '@tamagui/lucide-icons';

/**
 * Static screen rendered on top of authenticated content while the app is
 * inactive or backgrounded. Its purpose is to be the screen iOS captures for
 * the launch image, so that dream content is never visible during the snapshot.
 *
 * Deliberately NOT the LockScreen — that triggers Face ID on mount, and we
 * don't want every notification banner to start an auth flow.
 */
export function PrivacyOverlay() {
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
      space="$4"
      zIndex={998}
    >
      <Lock size={48} color="$gray10" />
      <Text fontSize="$6" fontWeight="bold" color="$color">
        Dream Locket
      </Text>
    </YStack>
  );
}
