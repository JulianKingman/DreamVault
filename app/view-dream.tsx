import React, { useState, useEffect, useMemo } from 'react';
import {
  SafeAreaView,
  StyleSheet,
  Alert,
  ScrollView,
  View,
  Share,
  TextInput,
  AppState,
  AppStateStatus,
  InputAccessoryView,
  Platform,
  Pressable,
  Keyboard,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { YStack, Text, Input, Button, XStack } from 'tamagui';
import { getDreamById, updateDream, toggleFavorite, deleteDream, setDreamTags, getAllTags, getIntentionForDate, setIntention } from '../utils/database';
import type { Dream, Intention, Tag } from '../types';
import { Bookmark, Trash2, X, Edit3, Share2, ChevronLeft, Compass, Check } from '@tamagui/lucide-icons';
import { AIInsights } from '../components/AIInsights';
import { AtmosphericBackground } from '../components/AtmosphericBackground';
import { GlassCard } from '../components/GlassCard';
import { useDebouncedEffect } from '../hooks/useDebouncedEffect';
import { useTheme } from '../contexts/ThemeContext';
import { getTextColor, getPlaceholderColor, getDividerColor } from '../utils/themeColors';

const VIEW_DREAM_DONE_BAR = 'view-dream-done';

function formatDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export default function ViewDreamScreen() {
  const { dreamId } = useLocalSearchParams<{ dreamId: string }>();
  const router = useRouter();
  const [dream, setDream] = useState<Dream | null>(null);
  const [intention, setIntentionState] = useState<Intention | null>(null);
  const [editedIntention, setEditedIntention] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState('');
  const [editedNotes, setEditedNotes] = useState('');
  const [editedTags, setEditedTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [allTags, setAllTags] = useState<Tag[]>([]);
  const { resolvedTheme } = useTheme();
  const themeColors = useMemo(
    () => ({
      text: getTextColor(resolvedTheme),
      placeholder: getPlaceholderColor(resolvedTheme),
      divider: getDividerColor(resolvedTheme),
    }),
    [resolvedTheme],
  );

  useEffect(() => {
    if (dreamId) {
      const fetched = getDreamById(Number(dreamId));
      if (fetched) {
        setDream(fetched);
        setEditedContent(fetched.content);
        setEditedNotes(fetched.notes ?? '');
        setEditedTags(fetched.tags?.map(t => t.name) ?? []);
        // Fetch intention for this dream's date
        const dateKey = formatDateKey(fetched.dateCreated);
        const fetchedIntention = getIntentionForDate(dateKey);
        setIntentionState(fetchedIntention);
        setEditedIntention(fetchedIntention?.content ?? '');
      }
    }
    setAllTags(getAllTags());
  }, [dreamId]);

  const startEditing = () => {
    if (!dream) return;
    setEditedContent(dream.content);
    setEditedNotes(dream.notes ?? '');
    setEditedTags(dream.tags?.map(t => t.name) ?? []);
    setEditedIntention(intention?.content ?? '');
    setIsEditing(true);
  };

  // Auto-save intention (per-day, debounced) while editing.
  useDebouncedEffect(
    () => {
      if (!isEditing || !dream) return;
      const dateKey = formatDateKey(dream.dateCreated);
      const trimmed = editedIntention.trim();
      const current = intention?.content ?? '';
      if (trimmed === current.trim()) return;
      // setIntention upserts; empty content deletes
      const updated = setIntention(dateKey, trimmed);
      setIntentionState(trimmed ? updated : null);
    },
    [editedIntention, isEditing, dream, intention],
    300,
  );

  // --- Auto-save while editing ---
  //
  // Debounced: text fields persist 300ms after the last keystroke. The effect
  // also runs once on entering edit mode (with initial values equal to the loaded
  // dream's), so we compare against the dream's current state to skip no-op writes.
  const flushEditSave = useDebouncedEffect(
    () => {
      if (!isEditing || !dream) return;
      const trimmedContent = editedContent.trim();
      if (!trimmedContent) return; // never save an empty dream
      const trimmedNotes = editedNotes.trim();
      const nextNotes = trimmedNotes || null;
      if (trimmedContent === dream.content && nextNotes === (dream.notes ?? null)) {
        return; // nothing changed
      }
      const updated: Dream = {
        ...dream,
        content: trimmedContent,
        notes: nextNotes,
      };
      updateDream(updated);
      setDream(updated);
    },
    [editedContent, editedNotes, isEditing, dream],
    300,
  );

  // Tags fire immediately (discrete add/remove, no keystroke noise to debounce).
  useEffect(() => {
    if (!isEditing || !dream) return;
    const currentTagNames = (dream.tags ?? []).map(t => t.name).sort();
    const nextTagNames = [...editedTags].sort();
    if (currentTagNames.join('') === nextTagNames.join('')) return;
    const tags = setDreamTags(dream.id, editedTags);
    setDream({ ...dream, tags });
  }, [editedTags, isEditing, dream]);

  // Flush any pending save when leaving the screen or backgrounding the app.
  useEffect(() => {
    return () => {
      flushEditSave();
    };
  }, [flushEditSave]);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (state: AppStateStatus) => {
      if (state === 'inactive' || state === 'background') {
        flushEditSave();
      }
    });
    return () => sub.remove();
  }, [flushEditSave]);

  const exitEditing = () => {
    flushEditSave();
    setIsEditing(false);
  };

  const handleToggleFavorite = () => {
    if (dream) {
      toggleFavorite(dream.id);
      setDream({ ...dream, isFavorite: !dream.isFavorite });
    }
  };

  const handleDelete = () => {
    if (!dream) return;
    Alert.alert(
      'Delete Dream',
      'Are you sure you want to delete this dream? This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            deleteDream(dream.id);
            router.back();
          },
        },
      ]
    );
  };

  const handleShare = () => {
    if (!dream) return;
    Alert.alert(
      'Share Dream',
      'Are you sure? Dreams are extremely private and may reveal deeply personal things that you\'re not aware of.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Share',
          onPress: async () => {
            const dateStr = new Date(dream.dateCreated).toLocaleDateString(undefined, {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            });
            let message = `${dateStr}\n\n${dream.content}`;
            if (intention) message += `\n\nIntention: ${intention.content}`;
            if (dream.notes) message += `\n\nNotes: ${dream.notes}`;
            if (dream.tags && dream.tags.length > 0) {
              message += `\n\n${dream.tags.map(t => `#${t.name}`).join(' ')}`;
            }
            await Share.share({ message });
          },
        },
      ]
    );
  };

  const addTag = (name: string) => {
    const trimmed = name.trim().toLowerCase();
    if (trimmed && !editedTags.includes(trimmed)) {
      setEditedTags(prev => [...prev, trimmed]);
    }
    setTagInput('');
  };

  const removeTag = (name: string) => {
    setEditedTags(prev => prev.filter(t => t !== name));
  };

  const filteredSuggestions = tagInput.trim()
    ? allTags
        .filter(
          t =>
            t.name.includes(tagInput.trim().toLowerCase()) &&
            !editedTags.includes(t.name)
        )
        .slice(0, 5)
    : [];

  if (!dream) {
    return (
      <View style={styles.container}>
        <AtmosphericBackground />
        <SafeAreaView style={styles.centered}>
          <Text color="$color" fontFamily="$body">Dream not found</Text>
        </SafeAreaView>
      </View>
    );
  }

  const dateString = new Date(dream.dateCreated).toLocaleDateString(
    undefined,
    {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    },
  );

  const timeString = new Date(dream.dateCreated).toLocaleTimeString(
    undefined,
    { hour: '2-digit', minute: '2-digit' },
  );

  return (
    <View style={styles.container}>
      <AtmosphericBackground />
      <SafeAreaView style={styles.container}>
        {/* Stable header — always visible, sits above the scroll content. */}
        <XStack paddingHorizontal="$4" paddingTop="$2" paddingBottom="$2">
          <Button
            unstyled
            onPress={() => router.back()}
            pressStyle={{ opacity: 0.7 }}
            paddingVertical="$2"
          >
            <XStack alignItems="center" gap="$1">
              <ChevronLeft size={20} color="$gray10" />
              <Text color="$gray10" fontFamily="$body" fontSize="$3">Back</Text>
            </XStack>
          </Button>
        </XStack>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          automaticallyAdjustKeyboardInsets
          keyboardDismissMode="interactive"
        >
          {isEditing ? (
            // Edit mode
            <YStack padding="$5" gap="$4">
              {/* Intention — per-day, auto-saves on type */}
              <YStack gap="$2">
                <XStack alignItems="center" gap="$1.5">
                  <Compass size={12} color="$gray10" />
                  <Text fontSize="$2" color="$gray10" fontFamily="$body" letterSpacing={1.5} textTransform="uppercase">
                    Intention for {dateString.split(',').slice(0, 2).join(',')}
                  </Text>
                </XStack>
                <TextInput
                  style={[styles.editField, { color: themeColors.text, borderBottomColor: themeColors.divider, fontStyle: 'italic' }]}
                  value={editedIntention}
                  onChangeText={setEditedIntention}
                  placeholder="What was your intention before sleep?"
                  placeholderTextColor={themeColors.placeholder}
                  inputAccessoryViewID={VIEW_DREAM_DONE_BAR}
                  multiline
                />
              </YStack>

              <TextInput
                style={[styles.editContent, { color: themeColors.text }]}
                multiline
                value={editedContent}
                onChangeText={setEditedContent}
                placeholder="Dream content..."
                placeholderTextColor={themeColors.placeholder}
                inputAccessoryViewID={VIEW_DREAM_DONE_BAR}
              />

              <YStack gap="$2">
                <Text fontSize="$2" color="$gray10" fontFamily="$body" letterSpacing={1.5} textTransform="uppercase">
                  Notes and Interpretation
                </Text>
                <TextInput
                  style={[styles.editField, { minHeight: 80, color: themeColors.text, borderBottomColor: themeColors.divider }]}
                  multiline
                  value={editedNotes}
                  onChangeText={setEditedNotes}
                  placeholder="Any additional thoughts..."
                  placeholderTextColor={themeColors.placeholder}
                  inputAccessoryViewID={VIEW_DREAM_DONE_BAR}
                />
              </YStack>

              {/* Tag editing */}
              <YStack gap="$2">
                <Text fontSize="$2" color="$gray10" fontFamily="$body" letterSpacing={1.5} textTransform="uppercase">
                  Vibes
                </Text>
                <TextInput
                  style={[styles.editField, { color: themeColors.text, borderBottomColor: themeColors.divider }]}
                  value={tagInput}
                  onChangeText={setTagInput}
                  placeholder="Add vibes..."
                  placeholderTextColor={themeColors.placeholder}
                  inputAccessoryViewID={VIEW_DREAM_DONE_BAR}
                  onSubmitEditing={() => {
                    if (tagInput.trim()) addTag(tagInput);
                  }}
                />
                {filteredSuggestions.length > 0 && (
                  <YStack backgroundColor="$backgroundStrong" borderRadius={16} padding="$2">
                    {filteredSuggestions.map(tag => (
                      <Text
                        key={tag.id}
                        padding="$2"
                        fontFamily="$body"
                        pressStyle={{ opacity: 0.7 }}
                        onPress={() => addTag(tag.name)}
                      >
                        {tag.name}
                      </Text>
                    ))}
                  </YStack>
                )}
                {editedTags.length > 0 && (
                  <XStack flexWrap="wrap" gap="$2">
                    {editedTags.map(tag => (
                      <XStack
                        key={tag}
                        backgroundColor="$gray6"
                        borderRadius={9999}
                        paddingHorizontal="$3"
                        paddingVertical="$1.5"
                        alignItems="center"
                        gap="$1"
                      >
                        <Text fontSize={11} fontFamily="$body" fontWeight="500" letterSpacing={1} textTransform="uppercase" color="$gray10">
                          {tag}
                        </Text>
                        <X size={12} color="$gray8" onPress={() => removeTag(tag)} />
                      </XStack>
                    ))}
                  </XStack>
                )}
              </YStack>

              <XStack alignItems="center" justifyContent="space-between" marginTop="$2">
                <XStack alignItems="center" gap="$1.5">
                  <Check size={12} color="$gray10" />
                  <Text fontSize={11} color="$gray10" fontFamily="$body" letterSpacing={1} textTransform="uppercase">
                    Saved automatically
                  </Text>
                </XStack>
                <Button
                  onPress={exitEditing}
                  backgroundColor="$accentBackground"
                  color="$accentColor"
                  borderRadius={9999}
                  fontFamily="$body"
                  fontWeight="600"
                  paddingHorizontal="$5"
                >
                  Done
                </Button>
              </XStack>
            </YStack>
          ) : (
            // View mode
            <YStack padding="$5" gap="$6">
              {/* Date */}
              <XStack alignItems="center" gap="$3">
                <View style={styles.dateLine} />
                <Text
                  fontFamily="$body"
                  fontSize="$2"
                  letterSpacing={2}
                  textTransform="uppercase"
                  color="$gray10"
                >
                  {dateString} · {timeString}
                </Text>
              </XStack>

              {/* Intention (from intentions table) */}
              {intention && (
                <XStack alignItems="flex-start" gap="$2">
                  <Compass size={14} color="$gray8" style={{ marginTop: 3 }} />
                  <Text fontFamily="$body" fontSize="$3" color="$gray8" fontStyle="italic">
                    {intention.content}
                  </Text>
                </XStack>
              )}

              {/* Dream content */}
              <Text
                fontFamily="$heading"
                fontSize="$7"
                lineHeight={32}
                color="$color"
              >
                {dream.content}
              </Text>

              {/* Notes and Interpretation */}
              {dream.notes && (
                <YStack
                  backgroundColor="$backgroundStrong"
                  borderRadius={20}
                  padding="$4"
                  gap="$2"
                >
                  <Text
                    fontSize="$2"
                    color="$gray10"
                    fontFamily="$body"
                    fontWeight="600"
                    letterSpacing={1.5}
                    textTransform="uppercase"
                  >
                    Notes and Interpretation
                  </Text>
                  <Text fontFamily="$body" fontSize="$4" lineHeight={22} color="$color">
                    {dream.notes}
                  </Text>
                </YStack>
              )}

              {/* Tags / Vibes */}
              {dream.tags && dream.tags.length > 0 && (
                <YStack gap="$3">
                  <Text
                    fontSize="$2"
                    color="$gray10"
                    fontFamily="$body"
                    fontWeight="600"
                    letterSpacing={1.5}
                    textTransform="uppercase"
                  >
                    Vibes
                  </Text>
                  <XStack flexWrap="wrap" gap="$2">
                    {dream.tags.map(tag => (
                      <XStack
                        key={tag.id}
                        backgroundColor="$gray6"
                        borderRadius={9999}
                        paddingHorizontal="$4"
                        paddingVertical="$2"
                      >
                        <Text
                          fontSize={11}
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
                </YStack>
              )}

              {/* AI Insights */}
              <AIInsights
                content={dream.content}
                onSuggestTags={(newTags) => {
                  const currentTags = dream.tags?.map(t => t.name) ?? [];
                  const merged = [...new Set([...currentTags, ...newTags])];
                  const tags = setDreamTags(dream.id, merged);
                  setDream({ ...dream, tags });
                }}
              />
            </YStack>
          )}
        </ScrollView>

        {/* Floating bottom action bar */}
        {!isEditing && (
          <View style={styles.actionBarWrapper}>
            <GlassCard
              style={styles.actionBarGlass}
              flexDirection="row"
              alignItems="center"
              justifyContent="center"
              gap={4}
              padding="$2"
            >
              <Button
                unstyled
                onPress={startEditing}
                pressStyle={{ opacity: 0.7, scale: 0.92 }}
                padding="$3"
                borderRadius={14}
              >
                <YStack alignItems="center" gap="$1">
                  <Edit3 size={20} color="$gray10" />
                  <Text fontSize={10} fontFamily="$body" fontWeight="500" color="$gray10">Edit</Text>
                </YStack>
              </Button>

              <Button
                unstyled
                onPress={handleToggleFavorite}
                pressStyle={{ opacity: 0.7, scale: 0.92 }}
                padding="$3"
                borderRadius={14}
                backgroundColor={dream.isFavorite ? '$accentBackground' : undefined}
              >
                <YStack alignItems="center" gap="$1">
                  <Bookmark
                    size={20}
                    color={dream.isFavorite ? '$accentColor' : '$gray10'}
                    fill={dream.isFavorite ? '#643400' : 'none'}
                  />
                  <Text
                    fontSize={10}
                    fontFamily="$body"
                    fontWeight="500"
                    color={dream.isFavorite ? '$accentColor' : '$gray10'}
                  >
                    Bookmark
                  </Text>
                </YStack>
              </Button>

              <Button
                unstyled
                onPress={handleShare}
                pressStyle={{ opacity: 0.7, scale: 0.92 }}
                padding="$3"
                borderRadius={14}
              >
                <YStack alignItems="center" gap="$1">
                  <Share2 size={20} color="$gray10" />
                  <Text fontSize={10} fontFamily="$body" fontWeight="500" color="$gray10">Share</Text>
                </YStack>
              </Button>

              <Button
                unstyled
                onPress={handleDelete}
                pressStyle={{ opacity: 0.7, scale: 0.92 }}
                padding="$3"
                borderRadius={14}
              >
                <YStack alignItems="center" gap="$1">
                  <Trash2 size={20} color="$red9" />
                  <Text fontSize={10} fontFamily="$body" fontWeight="500" color="$red9">Delete</Text>
                </YStack>
              </Button>
            </GlassCard>
          </View>
        )}
      </SafeAreaView>

      {Platform.OS === 'ios' && (
        <InputAccessoryView nativeID={VIEW_DREAM_DONE_BAR}>
          <View
            style={[
              styles.doneBar,
              { borderTopColor: themeColors.divider },
            ]}
          >
            <Pressable onPress={() => Keyboard.dismiss()} hitSlop={8}>
              <Text color="$accentBackground" fontWeight="600" fontSize="$4" fontFamily="$body">
                Done
              </Text>
            </Pressable>
          </View>
        </InputAccessoryView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingBottom: 120,
  },
  dateLine: {
    height: 1,
    width: 32,
    backgroundColor: 'rgba(33,72,125,0.3)',
  },
  actionBarWrapper: {
    position: 'absolute',
    bottom: 24,
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  actionBarGlass: {
    borderRadius: 20,
  },
  editContent: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 16,
    lineHeight: 24,
    minHeight: 200,
    textAlignVertical: 'top',
  },
  editField: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 15,
    lineHeight: 22,
    borderBottomWidth: 1,
    paddingVertical: 8,
  },
  doneBar: {
    backgroundColor: 'rgba(20,20,20,0.92)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    borderTopWidth: StyleSheet.hairlineWidth,
  },
});
