import React, { useCallback, useEffect, useRef } from 'react';
import { StyleSheet, TextInput, Keyboard, Platform } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import { XStack } from 'tamagui';
import { Search, X } from '@tamagui/lucide-icons';
import { GlassCard } from './GlassCard';
import { useTheme } from '../contexts/ThemeContext';
import { getTextColor, getPlaceholderColor } from '../utils/themeColors';

// Match FloatingTabBar's measured footprint so the search bar sits just above it.
const TAB_BAR_HEIGHT = 58;
const SEARCH_TAB_GAP = 10;

interface Props {
  value: string;
  onChangeText: (next: string) => void;
  /** Re-focus the input every time this screen becomes focused (not just on first mount). */
  focusOnFocus?: boolean;
}

/**
 * Sticky pill search bar that hovers above the tab bar and rises with the
 * keyboard. Used by Home and Search tabs so both share the same chrome.
 */
export function FloatingSearchBar({ value, onChangeText, focusOnFocus = false }: Props) {
  const insets = useSafeAreaInsets();
  const { resolvedTheme } = useTheme();
  const inputRef = useRef<TextInput>(null);

  const restingBottom = Math.max(insets.bottom, 8) + TAB_BAR_HEIGHT + SEARCH_TAB_GAP;
  const bottomOffset = useSharedValue(restingBottom);

  useEffect(() => {
    bottomOffset.value = restingBottom;
  }, [restingBottom]);

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showSub = Keyboard.addListener(showEvent, (e) => {
      bottomOffset.value = withTiming(e.endCoordinates.height + 12, { duration: 250 });
    });
    const hideSub = Keyboard.addListener(hideEvent, () => {
      bottomOffset.value = withTiming(restingBottom, { duration: 250 });
    });

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, [restingBottom]);

  // Re-focus on every tab focus when requested.
  useFocusEffect(
    useCallback(() => {
      if (!focusOnFocus) return;
      const t = setTimeout(() => inputRef.current?.focus(), 100);
      return () => clearTimeout(t);
    }, [focusOnFocus]),
  );

  const animatedStyle = useAnimatedStyle(() => ({
    bottom: bottomOffset.value,
  }));

  const textColor = getTextColor(resolvedTheme);
  const placeholderColor = getPlaceholderColor(resolvedTheme);

  return (
    <Animated.View style={[styles.searchBar, animatedStyle]}>
      <GlassCard
        style={styles.searchGlass}
        flexDirection="row"
        alignItems="center"
        paddingHorizontal="$4"
        paddingVertical="$3"
        gap="$3"
      >
        <Search size={18} color="$gray10" />
        <TextInput
          ref={inputRef}
          style={[styles.searchInput, { color: textColor }]}
          placeholder="Search dreams..."
          placeholderTextColor={placeholderColor}
          value={value}
          onChangeText={onChangeText}
          returnKeyType="search"
        />
        {value.length > 0 && (
          <XStack
            pressStyle={{ opacity: 0.7 }}
            onPress={() => onChangeText('')}
            padding="$1"
          >
            <X size={18} color="$gray10" />
          </XStack>
        )}
      </GlassCard>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  searchBar: {
    position: 'absolute',
    left: 16,
    right: 16,
  },
  searchGlass: {
    borderRadius: 16,
  },
  searchInput: {
    flex: 1,
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 16,
    paddingVertical: 0,
  },
});
