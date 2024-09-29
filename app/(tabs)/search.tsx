import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, SafeAreaView, View } from 'react-native';
import { Text, YStack } from 'tamagui';
import { CustomInput } from '../../components/CustomInput';
import { Search } from '@tamagui/lucide-icons';
import { NoteList, dummyDreams } from '../../components/NoteList';

export default function SearchScreen() {
  const inputRef = useRef(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const focusTimeout = setTimeout(() => {
      inputRef.current?.focus();
    }, 100);

    return () => clearTimeout(focusTimeout);
  }, []);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    // Implement actual search functionality here
  };

  const filteredDreams = dummyDreams.filter(
    dream =>
      dream.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      dream.description.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <YStack space="$4" style={styles.container}>
        <Text fontSize="$8" fontWeight="bold">
          Search Dreams
        </Text>
        <CustomInput
          ref={inputRef}
          placeholder="Enter search query"
          onChangeText={handleSearch}
          icon={<Search size={20} color="$gray10" />}
          width="100%"
        />
        <NoteList data={filteredDreams} />
      </YStack>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
    padding: 20,
  },
});
