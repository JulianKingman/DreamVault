import React, { useState, useCallback, ReactElement, useRef } from 'react';
import { FlatList, StyleSheet, Image, View, TextInput } from 'react-native';
import Animated from 'react-native-reanimated';
import { Text, YStack, XStack, Input, Button } from 'tamagui';
import { Trash2 } from '@tamagui/lucide-icons';
import { LinearGradient } from 'expo-linear-gradient';
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
  autoFocusSearch?: boolean;
  /** External search term — when provided, NoteList won't render its own search input */
  externalSearch?: string;
  headerComponent?: ReactElement;
  onScroll?: any;
  animated?: boolean;
}

export function NoteList({
  favoritesOnly = false,
  searchForm = false,
  searchPosition = 'top',
  autoFocusSearch = false,
  externalSearch,
  headerComponent,
  onScroll,
  animated = false,
}: NoteListProps) {
  const [internalSearch, setInternalSearch] = useState('');
  const searchTerm = externalSearch ?? internalSearch;
  const dreams = useDreams({ search: searchTerm, favoritesOnly });
  const searchRef = useRef<TextInput>(null);

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
        backgroundColor="$red9"
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
      .slice(0, 3)
      .join('\n')
      .trim();
    const truncatedContent =
      contentPreview.length > 150
        ? `${contentPreview.substring(0, 150)}...`
        : contentPreview;

    const hasImage = !!item.imageUri;

    return (
      <Swipeable
        renderRightActions={() => renderRightActions(item.id)}
        overshootRight={false}
      >
        <Link href={`/view-dream?dreamId=${item.id}`}>
          <YStack
            backgroundColor="$backgroundStrong"
            borderRadius={20}
            marginBottom="$3"
            overflow="hidden"
            width="100%"
          >
            {hasImage ? (
              // Image + text card
              <View style={styles.imageCard}>
                <Image
                  source={{ uri: item.imageUri! }}
                  style={styles.cardImage}
                />
                <LinearGradient
                  colors={['transparent', 'rgba(4,14,31,0.7)', 'rgba(4,14,31,0.95)']}
                  style={styles.imageOverlay}
                />
                <YStack style={styles.imageContent} padding="$4" gap="$2">
                  <Text
                    fontSize="$3"
                    color="$gray10"
                    fontFamily="$body"
                    letterSpacing={1.5}
                    textTransform="uppercase"
                  >
                    {dateString}
                  </Text>
                  <Text
                    fontFamily="$heading"
                    fontSize="$6"
                    lineHeight={28}
                    color="$color"
                    numberOfLines={3}
                  >
                    {truncatedContent}
                  </Text>
                  {item.tags && item.tags.length > 0 && (
                    <XStack flexWrap="wrap" gap="$2" marginTop="$1">
                      {item.tags.map(tag => (
                        <XStack
                          key={tag.id}
                          backgroundColor="$gray6"
                          borderRadius={9999}
                          paddingHorizontal="$3"
                          paddingVertical="$1.5"
                        >
                          <Text
                            fontSize={10}
                            fontFamily="$body"
                            fontWeight="500"
                            letterSpacing={1}
                            textTransform="uppercase"
                            color="$gray10"
                          >
                            {tag.name}
                          </Text>
                        </XStack>
                      ))}
                    </XStack>
                  )}
                </YStack>
              </View>
            ) : (
              // Text-only card
              <YStack padding="$4" gap="$2">
                <Text
                  fontSize="$2"
                  color="$gray10"
                  fontFamily="$body"
                  letterSpacing={1.5}
                  textTransform="uppercase"
                >
                  {dateString}
                </Text>
                <Text
                  fontFamily="$heading"
                  fontSize="$5"
                  lineHeight={26}
                  color="$color"
                  numberOfLines={3}
                >
                  {truncatedContent}
                </Text>
                {item.tags && item.tags.length > 0 && (
                  <XStack flexWrap="wrap" gap="$2" marginTop="$1">
                    {item.tags.map(tag => (
                      <XStack
                        key={tag.id}
                        backgroundColor="$gray6"
                        borderRadius={9999}
                        paddingHorizontal="$3"
                        paddingVertical="$1.5"
                      >
                        <Text
                          fontSize={10}
                          fontFamily="$body"
                          fontWeight="500"
                          letterSpacing={1}
                          textTransform="uppercase"
                          color="$gray10"
                        >
                          {tag.name}
                        </Text>
                      </XStack>
                    ))}
                  </XStack>
                )}
              </YStack>
            )}
          </YStack>
        </Link>
      </Swipeable>
    );
  }, [renderRightActions]);

  // Only render built-in search when not using externalSearch
  const showBuiltInSearch = searchForm && externalSearch === undefined;

  const searchInput = showBuiltInSearch ? (
    <Input
      ref={searchRef as any}
      placeholder="Search dreams..."
      value={internalSearch}
      onChangeText={setInternalSearch}
      marginBottom={searchPosition === 'top' ? '$2' : undefined}
      marginTop={searchPosition === 'bottom' ? '$2' : undefined}
      marginHorizontal="$4"
      borderRadius={9999}
      backgroundColor="$backgroundStrong"
      borderWidth={0}
      fontFamily="$body"
      autoFocus={autoFocusSearch}
    />
  ) : null;

  const listHeader = (
    <>
      {headerComponent}
      {showBuiltInSearch && searchPosition === 'top' ? searchInput : null}
    </>
  );

  const listFooter = showBuiltInSearch && searchPosition === 'bottom' ? searchInput : null;

  const ListComponent = animated ? AnimatedFlatList : FlatList;

  return (
    <ListComponent
      data={dreams}
      renderItem={renderItem}
      keyExtractor={(item: Dream) => `dream-${item.id}`}
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
    paddingBottom: 120, // Space for floating tab bar
  },
  imageCard: {
    minHeight: 320,
    position: 'relative',
  },
  cardImage: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  imageOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  imageContent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
});
