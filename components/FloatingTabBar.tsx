import React from 'react';
import { StyleSheet, Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { GlassCard } from './GlassCard';
import { useTheme } from '../contexts/ThemeContext';
import { getAccentGradient, getAccentForeground, getInactiveColor } from '../utils/themeColors';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';

/**
 * Floating glass tab bar — centered pill at the bottom of the screen.
 * 4 tabs: Home, Favorites, Search, Settings.
 * Active tab gets amber gradient highlight; inactive tabs are muted.
 */
export function FloatingTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const { resolvedTheme } = useTheme();
  const accentGradient = getAccentGradient(resolvedTheme);
  const accentFg = getAccentForeground(resolvedTheme);
  const inactiveColor = getInactiveColor(resolvedTheme);

  return (
    <View
      style={[
        styles.wrapper,
        { paddingBottom: Math.max(insets.bottom, 8) },
      ]}
      pointerEvents="box-none"
    >
      <GlassCard
        style={styles.glass}
        flexDirection="row"
        alignItems="center"
        justifyContent="space-around"
        paddingVertical={6}
        paddingHorizontal={6}
      >
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const isFocused = state.index === index;

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name, route.params);
            }
          };

          const onLongPress = () => {
            navigation.emit({
              type: 'tabLongPress',
              target: route.key,
            });
          };

          const icon = options.tabBarIcon?.({
            focused: isFocused,
            color: isFocused ? accentFg : inactiveColor,
            size: 22,
          });

          if (isFocused) {
            return (
              <Pressable
                key={route.key}
                accessibilityRole="button"
                accessibilityState={{ selected: true }}
                accessibilityLabel={options.tabBarAccessibilityLabel}
                onPress={onPress}
                onLongPress={onLongPress}
                style={({ pressed }) => [
                  styles.tab,
                  pressed && styles.tabPressed,
                ]}
              >
                <LinearGradient
                  colors={accentGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.activeGradient}
                >
                  {icon}
                </LinearGradient>
              </Pressable>
            );
          }

          return (
            <Pressable
              key={route.key}
              accessibilityRole="button"
              accessibilityState={{ selected: false }}
              accessibilityLabel={options.tabBarAccessibilityLabel}
              onPress={onPress}
              onLongPress={onLongPress}
              style={({ pressed }) => [
                styles.tab,
                styles.inactiveTab,
                pressed && styles.tabPressed,
              ]}
            >
              {icon}
            </Pressable>
          );
        })}
      </GlassCard>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  glass: {
    borderRadius: 20,
    width: '100%',
    maxWidth: 400,
  },
  tab: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeGradient: {
    borderRadius: 14,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inactiveTab: {
    padding: 12,
    borderRadius: 14,
  },
  tabPressed: {
    opacity: 0.7,
    transform: [{ scale: 0.92 }],
  },
});
