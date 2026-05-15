import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, Pressable, View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { GlassCard } from './GlassCard';
import { useTheme } from '../contexts/ThemeContext';
import { getAccentGradient, getAccentForeground, getInactiveColor } from '../utils/themeColors';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';

const INDICATOR_SIZE = 46;

/**
 * Floating glass tab bar — centered pill at the bottom of the screen.
 * 4 tabs: Home, Favorites, Search, Settings.
 * The active tab gets an amber gradient highlight that slides smoothly
 * between positions when the focused tab changes.
 */
export function FloatingTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const { resolvedTheme } = useTheme();
  const accentGradient = getAccentGradient(resolvedTheme);
  const accentFg = getAccentForeground(resolvedTheme);
  const inactiveColor = getInactiveColor(resolvedTheme);

  const [rowWidth, setRowWidth] = useState(0);
  const tabCount = state.routes.length;
  const slotWidth = rowWidth > 0 ? rowWidth / tabCount : 0;

  const translateX = useSharedValue(0);
  // Skip the slide animation the very first time we position the indicator —
  // otherwise it visibly flies in from x=0 on mount.
  const hasPositioned = useRef(false);

  useEffect(() => {
    if (slotWidth === 0) return;
    const target = state.index * slotWidth + (slotWidth - INDICATOR_SIZE) / 2;
    if (hasPositioned.current) {
      translateX.value = withTiming(target, { duration: 220 });
    } else {
      translateX.value = target;
      hasPositioned.current = true;
    }
  }, [state.index, slotWidth]);

  const indicatorStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  return (
    <View
      style={[
        styles.wrapper,
        { paddingBottom: Math.max(insets.bottom, 8) },
      ]}
      pointerEvents="box-none"
    >
      <GlassCard style={styles.glass} padding={6}>
        <View
          style={styles.row}
          onLayout={(e) => setRowWidth(e.nativeEvent.layout.width)}
        >
          {/* Sliding indicator — rendered behind the icons */}
          {slotWidth > 0 && (
            <Animated.View style={[styles.indicator, indicatorStyle]}>
              <LinearGradient
                colors={accentGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.activeGradient}
              />
            </Animated.View>
          )}

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

            return (
              <Pressable
                key={route.key}
                accessibilityRole="button"
                accessibilityState={{ selected: isFocused }}
                accessibilityLabel={options.tabBarAccessibilityLabel}
                onPress={onPress}
                onLongPress={onLongPress}
                style={({ pressed }) => [
                  styles.tab,
                  pressed && styles.tabPressed,
                ]}
              >
                {icon}
              </Pressable>
            );
          })}
        </View>
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
    paddingHorizontal: 16,
  },
  glass: {
    borderRadius: 20,
    width: '100%',
    maxWidth: 400,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  indicator: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: INDICATOR_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeGradient: {
    width: INDICATOR_SIZE,
    height: INDICATOR_SIZE,
    borderRadius: 14,
  },
  tabPressed: {
    opacity: 0.7,
    transform: [{ scale: 0.92 }],
  },
});
