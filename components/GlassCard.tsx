import React from 'react';
import { StyleSheet, ViewStyle } from 'react-native';
import { BlurView } from 'expo-blur';
import { YStack, YStackProps } from 'tamagui';
import { useTheme } from '../contexts/ThemeContext';

interface GlassCardProps extends YStackProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

/**
 * Frosted glass card component.
 * Semi-transparent background with blur effect.
 * Use for: floating nav bar, accessory bar, bottom sheets.
 */
export function GlassCard({ children, style, ...stackProps }: GlassCardProps) {
  const { resolvedTheme } = useTheme();

  // In light theme, use a lighter tint; in dark/midnight, use dark tint
  const tint = resolvedTheme === 'light' ? 'light' : 'dark';

  return (
    <BlurView
      intensity={40}
      tint={tint}
      style={[styles.container, style]}
    >
      <YStack
        backgroundColor={
          resolvedTheme === 'light'
            ? 'rgba(248, 238, 235, 0.4)'
            : resolvedTheme === 'midnight'
              ? 'rgba(10, 2, 2, 0.4)'
              : 'rgba(0, 25, 56, 0.4)'
        }
        flex={1}
        {...stackProps}
      >
        {children}
      </YStack>
    </BlurView>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    overflow: 'hidden',
  },
});
