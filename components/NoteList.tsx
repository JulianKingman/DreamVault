import React, { useState, useCallback, ReactElement } from 'react';
import { FlatList, StyleSheet } from 'react-native';
import Animated from 'react-native-reanimated';
import { Text, YStack, XStack, Separator, Input, Button } from 'tamagui';
import { Trash2 } from '@tamagui/lucide-icons';
import type { Dream } from '../types';
import { Link } from 'expo-router';
import { useDreams } from '@/hooks/useDreams';
import { deleteDream } from '@/utils/database';
import { Swipeable } from 'react-native-gesture-handler';
import { Alert } from 'react-native';

const AnimatedFlatList = Animated.createAnimatedComponent(FlatList<Dream>);

interface NoteListProps {
  favoritesOnly?: boolean;
  searchForm?: boolean;
  searchPosition?: 'top' | 'bottom';
  headerComponent?: ReactElement;
  onScroll?: any;
  animated?: boolean;
}

export function NoteList({
  favoritesOnly = false,
  searchForm = false,
  searchPosition = 'top',
  headerComponent,
  onScroll,
  animated = false,
}: NoteListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const dreams = useDreams({ search: searchTerm, favoritesOnly });

  const handleDelete = useCallback((id: number) => {
    Alert.alert(
      'Delete Dream',
      'Are you sure you want to delete this dream? This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteDream(id),
        },
      ]
    );
  }, []);

  const renderRightActions = useCallback((id: number) => {
    return (
      <Button
        backgroundColor="$red10"
        height="100%"
        borderRadius={0}
        paddingHorizontal="$4"
        onPress={() => handleDelete(id)}
        icon={<Trash2 color="white" size={20} />}
      />
    );
  }, [handleDelete]);

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
      <Swipeable
        renderRightActions={() => renderRightActions(item.id)}
        overshootRight={false}
      >
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
                {item.title || dateString}
              </Text>
            </XStack>
            {item.title && (
              <Text fontSize="$3" color="$gray10" marginTop="$1">
                {dateString}
              </Text>
            )}
            <Text fontSize="$4" numberOfLines={2} marginTop="$1">
              {truncatedContent}
            </Text>
            {item.tags && item.tags.length > 0 && (
              <XStack flexWrap="wrap" gap="$1" marginTop="$2">
                {item.tags.map(tag => (
                  <XStack
                    key={tag.id}
                    backgroundColor="$blue4"
                    borderRadius="$4"
                    paddingHorizontal="$2"
                    paddingVertical="$0.5"
                  >
                    <Text fontSize="$2">{tag.name}</Text>
                  </XStack>
                ))}
              </XStack>
            )}
          </YStack>
        </Link>
      </Swipeable>
    );
  }, [renderRightActions]);

  const searchInput = searchForm ? (
    <Input
      placeholder="Search dreams..."
      value={searchTerm}
      onChangeText={setSearchTerm}
      marginBottom={searchPosition === 'top' ? '$2' : undefined}
      marginTop={searchPosition === 'bottom' ? '$2' : undefined}
      marginHorizontal="$4"
    />
  ) : null;

  const listHeader = (
    <>
      {headerComponent}
      {searchForm && searchPosition === 'top' ? searchInput : null}
    </>
  );

  const listFooter = searchForm && searchPosition === 'bottom' ? searchInput : null;

  const ListComponent = animated ? AnimatedFlatList : FlatList;

  return (
    <ListComponent
      data={dreams}
      renderItem={renderItem}
      keyExtractor={(item: Dream) => `dream-${item.id}`}
      ItemSeparatorComponent={() => <Separator />}
      contentContainerStyle={styles.listContent}
      ListHeaderComponent={listHeader}
      ListFooterComponent={listFooter}
      onScroll={onScroll}
      scrollEventThrottle={16}
    />
  );
}

const styles = StyleSheet.create({
  listContent: {
    padding: 16,
  },
});
