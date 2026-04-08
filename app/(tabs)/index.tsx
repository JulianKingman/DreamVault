import React, { useState, useRef } from 'react';
import { SafeAreaView, View, StyleSheet, TextInput, Keyboard } from 'react-native';
import { Input, XStack, Text } from 'tamagui';
import { Search, X } from '@tamagui/lucide-icons';
import { NoteList } from '../../components/NoteList';
import { AtmosphericBackground } from '../../components/AtmosphericBackground';
import { GlassCard } from '../../components/GlassCard';

export default function HomeScreen() {
  const [searchVisible, setSearchVisible] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const searchRef = useRef<TextInput>(null);

  const openSearch = () => {
    setSearchVisible(true);
    // Focus after the sheet renders
    setTimeout(() => searchRef.current?.focus(), 100);
  };

  const closeSearch = () => {
    setSearchVisible(false);
    setSearchTerm('');
    Keyboard.dismiss();
  };

  return (
    <View style={styles.container}>
      <AtmosphericBackground />
      <SafeAreaView style={styles.container}>
        <NoteList
          externalSearch={searchTerm}
        />

        {/* Search bottom sheet */}
        {searchVisible ? (
          <View style={styles.searchSheet}>
            <GlassCard
              style={styles.searchGlass}
              flexDirection="row"
              alignItems="center"
              paddingHorizontal="$3"
              paddingVertical="$2"
              gap="$2"
            >
              <Search size={18} color="$gray10" />
              <TextInput
                ref={searchRef}
                style={styles.searchInput}
                placeholder="Search dreams..."
                placeholderTextColor="#4e5c71"
                value={searchTerm}
                onChangeText={setSearchTerm}
                autoFocus
                returnKeyType="search"
              />
              <XStack
                pressStyle={{ opacity: 0.7 }}
                onPress={closeSearch}
                padding="$2"
              >
                <X size={18} color="$gray10" />
              </XStack>
            </GlassCard>
          </View>
        ) : (
          <View style={styles.searchButton}>
            <GlassCard
              style={styles.searchButtonGlass}
              pressStyle={{ opacity: 0.7, scale: 0.95 }}
              onPress={openSearch}
              padding="$3"
              alignItems="center"
              justifyContent="center"
            >
              <Search size={20} color="$gray10" />
            </GlassCard>
          </View>
        )}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchSheet: {
    position: 'absolute',
    bottom: 90,
    left: 16,
    right: 16,
  },
  searchGlass: {
    borderRadius: 9999,
  },
  searchInput: {
    flex: 1,
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 15,
    color: '#dae6ff',
    paddingVertical: 8,
  },
  searchButton: {
    position: 'absolute',
    bottom: 90,
    left: 16,
  },
  searchButtonGlass: {
    borderRadius: 9999,
    width: 48,
    height: 48,
  },
});
