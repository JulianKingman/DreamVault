import React, { useState, useEffect } from 'react';
import { SafeAreaView, View, StyleSheet, TextInput, Keyboard, Platform } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { XStack } from 'tamagui';
import { Search, X } from '@tamagui/lucide-icons';
import { NoteList } from '../../components/NoteList';
import { AtmosphericBackground } from '../../components/AtmosphericBackground';
import { GlassCard } from '../../components/GlassCard';
import { useTheme } from '../../contexts/ThemeContext';

// Tab bar height: paddingVertical(6) + icon+padding(46) + paddingVertical(6) = 58
const TAB_BAR_HEIGHT = 58;
const SEARCH_TAB_GAP = 10;

export default function HomeScreen() {
  const [searchTerm, setSearchTerm] = useState('');
  const { resolvedTheme } = useTheme();
  const insets = useSafeAreaInsets();

  // Resting position: above tab bar (insets.bottom + tab bar + gap)
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

  const animatedStyle = useAnimatedStyle(() => ({
    bottom: bottomOffset.value,
  }));

  const textColor =
    resolvedTheme === 'light'
      ? '#2a1f1b'
      : resolvedTheme === 'midnight'
        ? 'hsl(0, 50%, 40%)'
        : '#dae6ff';

  const placeholderColor =
    resolvedTheme === 'light'
      ? '#9a8a85'
      : resolvedTheme === 'midnight'
        ? 'hsl(0, 20%, 30%)'
        : '#4e5c71';

  return (
    <View style={styles.container}>
      <AtmosphericBackground />
      <SafeAreaView style={styles.container}>
        <NoteList externalSearch={searchTerm} />
      </SafeAreaView>

      {/* Search bar — matches NoteList horizontal padding (16), sits above tab bar */}
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
            style={[styles.searchInput, { color: textColor }]}
            placeholder="Search dreams..."
            placeholderTextColor={placeholderColor}
            value={searchTerm}
            onChangeText={setSearchTerm}
            returnKeyType="search"
          />
          {searchTerm.length > 0 && (
            <XStack
              pressStyle={{ opacity: 0.7 }}
              onPress={() => setSearchTerm('')}
              padding="$1"
            >
              <X size={18} color="$gray10" />
            </XStack>
          )}
        </GlassCard>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
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
