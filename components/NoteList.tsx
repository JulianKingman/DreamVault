import React, { useState, useCallback, useMemo, ReactElement, useRef } from 'react';
import { StyleSheet, Image, View, TextInput, SectionList, Pressable } from 'react-native';
import { Text, YStack, XStack, Input, Button } from 'tamagui';
import { Trash2, Compass } from '@tamagui/lucide-icons';
import { LinearGradient } from 'expo-linear-gradient';
import type { Dream, Intention } from '../types';
import { Link } from 'expo-router';
import { useDreams } from '@/hooks/useDreams';
import { deleteDream, getIntentionsForDates } from '@/utils/database';
import { Swipeable } from 'react-native-gesture-handler';
import { Alert } from 'react-native';
import { IntentionBottomSheet, type IntentionBottomSheetRef } from './IntentionBottomSheet';

interface NoteListProps {
  favoritesOnly?: boolean;
  searchForm?: boolean;
  searchPosition?: 'top' | 'bottom';
  autoFocusSearch?: boolean;
  externalSearch?: string;
  headerComponent?: ReactElement;
  onScroll?: any;
}

interface DateSection {
  dateKey: string;
  dateLabel: string;
  intention: Intention | undefined;
  data: Dream[];
}

function formatDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function NoteList({
  favoritesOnly = false,
  searchForm = false,
  searchPosition = 'top',
  autoFocusSearch = false,
  externalSearch,
  headerComponent,
  onScroll,
}: NoteListProps) {
  const [internalSearch, setInternalSearch] = useState('');
  const searchTerm = externalSearch ?? internalSearch;
  const { dreams, dataVersion } = useDreams({ search: searchTerm, favoritesOnly });
  const searchRef = useRef<TextInput>(null);
  const intentionSheetRef = useRef<IntentionBottomSheetRef>(null);

  // Group dreams by date and fetch intentions
  // Always include today's date so users can set an intention even with no dreams yet
  const sections: DateSection[] = useMemo(() => {
    const grouped = new Map<string, Dream[]>();
    const todayKey = formatDateKey(new Date());

    // Ensure today exists in the map (will be first since it's the most recent)
    if (!favoritesOnly && !searchTerm) {
      grouped.set(todayKey, []);
    }

    for (const dream of dreams) {
      const key = formatDateKey(dream.dateCreated);
      if (!grouped.has(key)) grouped.set(key, []);
      grouped.get(key)!.push(dream);
    }

    const dateKeys = Array.from(grouped.keys());
    const intentions = getIntentionsForDates(dateKeys);

    return dateKeys.map(dateKey => {
      const dreamsForDate = grouped.get(dateKey)!;
      const dateObj = dreamsForDate.length > 0
        ? dreamsForDate[0].dateCreated
        : new Date(dateKey + 'T12:00:00'); // noon to avoid timezone edge cases
      const dateLabel = dateObj.toLocaleDateString(undefined, {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
      return {
        dateKey,
        dateLabel,
        intention: intentions.get(dateKey),
        data: dreamsForDate,
      };
    });
  }, [dreams, favoritesOnly, searchTerm, dataVersion]);

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

  const openIntentionSheet = useCallback((section: DateSection) => {
    intentionSheetRef.current?.open(section.dateKey, section.dateLabel, section.intention);
  }, []);

  const renderSectionHeader = useCallback(({ section }: { section: DateSection }) => (
    <YStack paddingTop="$4" paddingBottom="$2" gap="$1">
      <Text
        fontSize="$2"
        color="$gray10"
        fontFamily="$body"
        fontWeight="600"
        letterSpacing={1.5}
        textTransform="uppercase"
      >
        {section.dateLabel}
      </Text>
      <Pressable onPress={() => openIntentionSheet(section)}>
        <XStack alignItems="center" gap="$1.5" marginTop="$1">
          <Compass size={12} color="$gray8" />
          <Text
            fontSize="$2"
            color="$gray8"
            fontFamily="$body"
            fontStyle="italic"
            numberOfLines={1}
          >
            {section.intention ? section.intention.content : 'Set intention...'}
          </Text>
        </XStack>
      </Pressable>
    </YStack>
  ), [openIntentionSheet]);

  const renderItem = useCallback(({ item }: { item: Dream }) => {
    const timeString = item.dateCreated.toLocaleTimeString(undefined, {
      hour: 'numeric',
      minute: '2-digit',
    });

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
      <YStack
        borderRadius={20}
        overflow="hidden"
        marginBottom="$2"
        width="100%"
      >
        <Swipeable
          renderRightActions={() => renderRightActions(item.id)}
          overshootRight={false}
        >
          <Link href={`/view-dream?dreamId=${item.id}`} asChild>
            <YStack
              backgroundColor="$backgroundStrong"
              width="100%"
            >
              {hasImage ? (
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
                      fontSize="$1"
                      color="$gray8"
                      fontFamily="$body"
                      letterSpacing={1}
                      textTransform="uppercase"
                    >
                      {timeString}
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
                <YStack padding="$4" gap="$2">
                  <Text
                    fontSize="$1"
                    color="$gray8"
                    fontFamily="$body"
                    letterSpacing={1}
                    textTransform="uppercase"
                  >
                    {timeString}
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
      </YStack>
    );
  }, [renderRightActions]);

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

  return (
    <>
      <SectionList
        sections={sections}
        keyExtractor={(item: Dream) => `dream-${item.id}`}
        renderItem={renderItem}
        renderSectionHeader={renderSectionHeader}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={listHeader}
        ListFooterComponent={listFooter}
        onScroll={onScroll}
        scrollEventThrottle={16}
        stickySectionHeadersEnabled={false}
      />
      <IntentionBottomSheet ref={intentionSheetRef} />
    </>
  );
}

const styles = StyleSheet.create({
  listContent: {
    padding: 16,
    paddingBottom: 180,
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
