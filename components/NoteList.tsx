import React, { useState, useCallback } from 'react';
import { FlatList, StyleSheet } from 'react-native';
import { Text, YStack, XStack, Separator, Input } from 'tamagui';
import type { Dream } from '../types';
import { Link } from 'expo-router';
import { useDreams } from '@/hooks/useDreams';

export function NoteList({ favoritesOnly = false, searchForm = false }) {
  const [searchTerm, setSearchTerm] = useState('');
  const dreams = useDreams({ search: searchTerm, favoritesOnly });

  const renderItem = useCallback(({ item }: { item: Dream }) => {
    const dateString = new Date(item.dateCreated).toLocaleDateString(
      undefined,
      {
        weekday: 'long',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      },
    );

    const contentPreview = item.content
      .split('\n')
      .slice(0, 2)
      .join('\n')
      .trim();
    const truncatedContent =
      contentPreview.length > 100
        ? `${contentPreview.substring(0, 100)}...`
        : contentPreview;

    return (
      <Link href={`/view-dream?dreamId=${item.id}`}>
        <YStack
          padding="$3"
          backgroundColor="$backgroundStrong"
          borderRadius="$2"
          marginBottom="$2"
          borderColor="$border"
          borderWidth=".2"
          width="100%"
        >
          <XStack justifyContent="space-between" alignItems="center">
            <Text fontSize="$5" fontWeight="bold" numberOfLines={1}>
              {dateString}
            </Text>
          </XStack>
          <Text fontSize="$4" numberOfLines={2} marginTop="$1">
            {truncatedContent}
          </Text>
        </YStack>
      </Link>
    );
  }, []);

  return (
    <YStack flex={1}>
      {searchForm && (
        <Input
          placeholder="Search dreams..."
          value={searchTerm}
          onChangeText={setSearchTerm}
          marginBottom="$2"
        />
      )}
      <FlatList
        data={dreams}
        renderItem={renderItem}
        keyExtractor={item => `dream-${item.id}`}
        ItemSeparatorComponent={() => <Separator />}
        contentContainerStyle={styles.listContent}
      />
    </YStack>
  );
}

const styles = StyleSheet.create({
  listContent: {
    padding: 16,
  },
});
