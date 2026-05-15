import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  ScrollView,
  StyleSheet,
  TextInput,
  View,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  AppState,
  AppStateStatus,
  InputAccessoryView,
  Keyboard,
} from 'react-native';
import { Button, YStack, XStack, Text, Spinner } from 'tamagui';
import { X, Sparkles, Check } from '@tamagui/lucide-icons';
import { LinearGradient } from 'expo-linear-gradient';
import {
  addDream,
  updateDream,
  deleteDream,
  setDreamTags,
  getRecentTags,
  searchTags,
  getOrCreateTag,
  getIntentionForDate,
  setIntention,
  toggleFavorite,
} from '../utils/database';
import { useRouter, useLocalSearchParams } from 'expo-router';
import type { Tag as TagType } from '../types';
import { useAI } from '../hooks/useAI';
import { GlassCard } from './GlassCard';
import { useDebouncedEffect } from '../hooks/useDebouncedEffect';
import { useTheme } from '../contexts/ThemeContext';
import {
  getTextColor,
  getPlaceholderColor,
  getDividerColor,
  getBgFadeTopColors,
  getBgFadeBottomColors,
} from '../utils/themeColors';
import DateTimePicker from '@react-native-community/datetimepicker';

const DONE_BAR_ID = 'dream-form-done';
const DEFAULT_VIBES = [
  'lucid', 'nightmare', 'recurring', 'flying', 'falling',
  'chasing', 'water', 'animals', 'people', 'places',
  'surreal', 'vivid', 'peaceful', 'anxious', 'prophetic',
];

interface NewDreamFormProps {
  isFavorite?: boolean;
}

function formatDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function NewDreamForm({ isFavorite = false }: NewDreamFormProps) {
  const params = useLocalSearchParams<{ prefillDate?: string; prefillIntention?: string }>();
  const [dreamDate, setDreamDate] = useState(() => {
    if (params.prefillDate) return new Date(params.prefillDate);
    return new Date();
  });
  const [intention, setIntentionText] = useState(params.prefillIntention ?? '');
  const [content, setContent] = useState('');
  const [notes, setNotes] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [tagQuery, setTagQuery] = useState('');
  const [tagResults, setTagResults] = useState<TagType[]>([]);
  const [recentTags, setRecentTags] = useState<TagType[]>([]);
  const [suggestingTags, setSuggestingTags] = useState(false);
  const contentRef = useRef<TextInput>(null);
  const router = useRouter();
  const { available: aiAvailable, suggestTags: aiSuggestTags } = useAI();
  const { resolvedTheme } = useTheme();
  const themeColors = useMemo(
    () => ({
      text: getTextColor(resolvedTheme),
      placeholder: getPlaceholderColor(resolvedTheme),
      divider: getDividerColor(resolvedTheme),
      topFade: getBgFadeTopColors(resolvedTheme),
      bottomFade: getBgFadeBottomColors(resolvedTheme),
    }),
    [resolvedTheme],
  );

  // Auto-save state
  const [dreamId, setDreamId] = useState<number | null>(null);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saved'>('idle');
  // Track the last persisted values so we skip no-op writes (avoids spurious
  // dateModified bumps which would confuse the sync layer).
  const lastSavedIntentionRef = useRef<string>('');
  const lastSavedContentRef = useRef<string>('');
  const lastSavedNotesRef = useRef<string>('');
  const lastSavedDateRef = useRef<number>(0); // ms epoch
  const lastSavedTagsRef = useRef<string[]>([]);

  // Load intention for the selected date
  useEffect(() => {
    if (!params.prefillIntention) {
      const dateKey = formatDateKey(dreamDate);
      const existing = getIntentionForDate(dateKey);
      if (existing) {
        setIntentionText(existing.content);
        lastSavedIntentionRef.current = existing.content;
      }
    } else {
      lastSavedIntentionRef.current = params.prefillIntention;
    }
  }, []);

  // When date changes, load that date's intention
  const handleDateChange = useCallback((_: any, date?: Date) => {
    if (!date) return;
    setDreamDate(date);
    const dateKey = formatDateKey(date);
    const existing = getIntentionForDate(dateKey);
    const next = existing?.content ?? '';
    setIntentionText(next);
    lastSavedIntentionRef.current = next;
  }, []);

  useEffect(() => {
    // Seed common vibes if the user has none yet, so the Recent row isn't empty.
    let recent = getRecentTags(15);
    if (recent.length === 0) {
      for (const name of DEFAULT_VIBES) getOrCreateTag(name);
      recent = getRecentTags(15);
    }
    setRecentTags(recent);
    setTimeout(() => contentRef.current?.focus(), 300);
  }, []);

  useEffect(() => {
    if (tagQuery.trim()) {
      setTagResults(searchTags(tagQuery));
    } else {
      setTagResults([]);
    }
  }, [tagQuery]);

  const addTag = useCallback((name: string) => {
    const trimmed = name.trim().toLowerCase();
    if (trimmed && !selectedTags.includes(trimmed)) {
      getOrCreateTag(trimmed);
      setSelectedTags(prev => [...prev, trimmed]);
    }
    setTagQuery('');
  }, [selectedTags]);

  const removeTag = useCallback((name: string) => {
    setSelectedTags(prev => prev.filter(t => t !== name));
  }, []);

  // --- Auto-save: dream + intention ---
  //
  // Strategy: on debounced changes to any persisted field, reconcile the DB with
  // the current form state. Creates the dream the first time content is non-empty,
  // updates it thereafter, and deletes if content goes back to empty.
  //
  // Tags are handled separately (immediately, not debounced) because add/remove
  // are discrete actions and we want the side panel of recent tags to feel snappy.
  const flushSave = useDebouncedEffect(
    () => {
      const trimmedContent = content.trim();
      const trimmedNotes = notes.trim();
      const trimmedIntention = intention.trim();
      const dateKey = formatDateKey(dreamDate);

      // Persist intention independently of the dream (one per calendar date).
      if (trimmedIntention && trimmedIntention !== lastSavedIntentionRef.current) {
        setIntention(dateKey, trimmedIntention);
        lastSavedIntentionRef.current = trimmedIntention;
      }

      if (!trimmedContent) {
        // No content: roll back any auto-created dream so we don't leave empty rows.
        if (dreamId !== null) {
          deleteDream(dreamId);
          setDreamId(null);
          setSaveStatus('idle');
          lastSavedContentRef.current = '';
          lastSavedNotesRef.current = '';
          lastSavedTagsRef.current = [];
        }
        return;
      }

      if (dreamId === null) {
        const created = addDream(
          trimmedContent,
          undefined,
          trimmedNotes || undefined,
          dreamDate,
        );
        setDreamId(created.id);
        if (selectedTags.length > 0) {
          setDreamTags(created.id, selectedTags);
        }
        if (isFavorite) {
          toggleFavorite(created.id);
        }
        lastSavedContentRef.current = trimmedContent;
        lastSavedNotesRef.current = trimmedNotes;
        lastSavedDateRef.current = dreamDate.getTime();
        lastSavedTagsRef.current = [...selectedTags];
        setSaveStatus('saved');
        return;
      }

      // Update branch — skip if nothing actually changed since the last write.
      const dateUnchanged = dreamDate.getTime() === lastSavedDateRef.current;
      const contentUnchanged = trimmedContent === lastSavedContentRef.current;
      const notesUnchanged = trimmedNotes === lastSavedNotesRef.current;
      if (dateUnchanged && contentUnchanged && notesUnchanged) {
        return;
      }
      updateDream({
        id: dreamId,
        content: trimmedContent,
        notes: trimmedNotes || null,
        title: null,
        isFavorite,
        dateCreated: dreamDate,
        dateModified: new Date(),
      });
      lastSavedContentRef.current = trimmedContent;
      lastSavedNotesRef.current = trimmedNotes;
      lastSavedDateRef.current = dreamDate.getTime();
      setSaveStatus('saved');
    },
    [content, notes, intention, dreamDate, dreamId, selectedTags, isFavorite],
    300,
  );

  // Tags fire immediately once we have a dream row (no debounce — discrete action).
  // Skips the redundant write that would otherwise happen right after a create,
  // because the debounced save's create branch already persisted the tags.
  useEffect(() => {
    if (dreamId === null) return;
    const sortedCurrent = [...lastSavedTagsRef.current].sort().join('\0');
    const sortedNext = [...selectedTags].sort().join('\0');
    if (sortedCurrent === sortedNext) return;
    setDreamTags(dreamId, selectedTags);
    lastSavedTagsRef.current = [...selectedTags];
  }, [selectedTags, dreamId]);

  // Flush pending save on unmount (e.g. user swipes the modal away).
  useEffect(() => {
    return () => {
      flushSave();
    };
  }, [flushSave]);

  // Flush pending save when the app backgrounds.
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state: AppStateStatus) => {
      if (state === 'inactive' || state === 'background') {
        flushSave();
      }
    });
    return () => sub.remove();
  }, [flushSave]);

  const handleDone = () => {
    flushSave();
    router.back();
  };

  const handleAddAnother = () => {
    flushSave();
    // Replace the current form so the user doesn't end up with a stack of saved forms.
    router.replace({
      pathname: '/new-dream',
      params: {
        prefillDate: dreamDate.toISOString(),
        prefillIntention: intention,
      },
    });
  };

  const hasContent = content.trim().length > 0;

  const suggestedTags = recentTags.filter(t => !selectedTags.includes(t.name));
  const filteredResults = tagResults.filter(t => !selectedTags.includes(t.name));
  const exactMatch = tagQuery.trim() && tagResults.some(
    t => t.name === tagQuery.trim().toLowerCase()
  );
  const showAddOption = tagQuery.trim().length > 0
    && !exactMatch
    && !selectedTags.includes(tagQuery.trim().toLowerCase());

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={80}
    >
      <View style={styles.flex}>
      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        automaticallyAdjustKeyboardInsets
        keyboardDismissMode="interactive"
      >
        {/* Date + Time picker */}
        <YStack paddingHorizontal={24}>
          <XStack alignItems="center" justifyContent="space-between" marginBottom="$1">
            <Text
              fontSize="$2"
              color="$gray10"
              fontFamily="$body"
              fontWeight="600"
              letterSpacing={1.5}
              textTransform="uppercase"
            >
              Date & Time
            </Text>
            {saveStatus === 'saved' && (
              <XStack alignItems="center" gap="$1.5">
                <Check size={12} color="$gray10" />
                <Text fontSize={11} color="$gray10" fontFamily="$body" letterSpacing={1} textTransform="uppercase">
                  Saved
                </Text>
              </XStack>
            )}
          </XStack>
          <DateTimePicker
            value={dreamDate}
            mode="datetime"
            display="compact"
            onChange={handleDateChange}
            themeVariant="dark"
            style={styles.datePicker}
          />
        </YStack>

        {/* Intention */}
        <YStack paddingHorizontal={24} gap="$2" marginTop="$4">
          <Text
            fontSize="$2"
            color="$gray10"
            fontFamily="$body"
            fontWeight="600"
            letterSpacing={1.5}
            textTransform="uppercase"
          >
            Intention
          </Text>
          <TextInput
            style={[styles.secondaryInput, { color: themeColors.text, borderBottomColor: themeColors.divider }]}
            placeholder="What was your intention before sleep?"
            placeholderTextColor={themeColors.placeholder}
            value={intention}
            onChangeText={setIntentionText}
            inputAccessoryViewID={DONE_BAR_ID}
          />
        </YStack>

        {/* Main content area */}
        <YStack paddingHorizontal={24} gap="$2" marginTop="$4">
          <Text
            fontSize="$2"
            color="$gray10"
            fontFamily="$body"
            fontWeight="600"
            letterSpacing={1.5}
            textTransform="uppercase"
          >
            Dream
          </Text>
          <GlassCard style={styles.glassCard} padding="$4">
            <TextInput
              ref={contentRef}
              style={[styles.glassInput, { color: themeColors.text }]}
              multiline
              placeholder="Describe your dream..."
              placeholderTextColor={themeColors.placeholder}
              value={content}
              onChangeText={setContent}
              textAlignVertical="top"
              inputAccessoryViewID={DONE_BAR_ID}
            />
          </GlassCard>
        </YStack>

        {/* Notes and Interpretation */}
        <YStack paddingHorizontal={24} gap="$2" marginTop="$4">
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
          <GlassCard style={styles.glassCard} padding="$4">
            <TextInput
              style={[styles.glassInput, styles.notesInput, { color: themeColors.text }]}
              multiline
              placeholder="Record the deeper resonance..."
              placeholderTextColor={themeColors.placeholder}
              value={notes}
              onChangeText={setNotes}
              textAlignVertical="top"
              inputAccessoryViewID={DONE_BAR_ID}
            />
          </GlassCard>
        </YStack>

        {/* Tags section */}
        <YStack paddingHorizontal={24} gap="$3" marginTop="$4">
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

          {/* Selected tags */}
          {selectedTags.length > 0 && (
            <XStack flexWrap="wrap" gap="$2">
              {selectedTags.map(tag => (
                <XStack
                  key={tag}
                  backgroundColor="$accentBackground"
                  borderRadius={9999}
                  paddingHorizontal="$3"
                  paddingVertical="$1.5"
                  alignItems="center"
                  gap="$1"
                >
                  <Text
                    fontSize={11}
                    fontFamily="$body"
                    fontWeight="500"
                    letterSpacing={1}
                    textTransform="uppercase"
                    color="$accentColor"
                  >
                    {tag}
                  </Text>
                  <Pressable onPress={() => removeTag(tag)} hitSlop={8}>
                    <X size={12} color="$accentColor" />
                  </Pressable>
                </XStack>
              ))}
            </XStack>
          )}

          {/* Tag search input */}
          <TextInput
            style={[styles.tagInput, { color: themeColors.text, borderBottomColor: themeColors.divider }]}
            placeholder="Search or add vibes..."
            placeholderTextColor={themeColors.placeholder}
            value={tagQuery}
            onChangeText={setTagQuery}
            onSubmitEditing={() => {
              if (tagQuery.trim()) addTag(tagQuery);
            }}
            returnKeyType="done"
            inputAccessoryViewID={DONE_BAR_ID}
          />

          {/* Search results */}
          {tagQuery.trim().length > 0 && (filteredResults.length > 0 || showAddOption) && (
            <YStack backgroundColor="$backgroundStrong" borderRadius={16} padding="$2" gap="$1">
              {filteredResults.map(tag => (
                <Pressable
                  key={tag.id}
                  onPress={() => addTag(tag.name)}
                  style={({ pressed }) => [
                    styles.tagSuggestion,
                    pressed && { opacity: 0.7 },
                  ]}
                >
                  <Text fontFamily="$body" fontSize="$3" color="$color">
                    {tag.name}
                  </Text>
                </Pressable>
              ))}
              {showAddOption && (
                <Pressable
                  onPress={() => addTag(tagQuery)}
                  style={({ pressed }) => [
                    styles.tagSuggestion,
                    pressed && { opacity: 0.7 },
                  ]}
                >
                  <Text fontFamily="$body" fontSize="$3" color="$accentBackground">
                    Add "{tagQuery.trim().toLowerCase()}"
                  </Text>
                </Pressable>
              )}
            </YStack>
          )}

          {/* Recent tags (when not searching) */}
          {!tagQuery.trim() && suggestedTags.length > 0 && (
            <YStack gap="$2">
              <Text fontSize={10} fontFamily="$body" color="$gray8" letterSpacing={1} textTransform="uppercase">
                Recent
              </Text>
              <XStack flexWrap="wrap" gap="$2">
                {suggestedTags.map(tag => (
                  <Pressable
                    key={tag.id}
                    onPress={() => addTag(tag.name)}
                  >
                    <XStack
                      backgroundColor="$gray6"
                      borderRadius={9999}
                      paddingHorizontal="$3"
                      paddingVertical="$1.5"
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
                  </Pressable>
                ))}
              </XStack>
            </YStack>
          )}

          {/* AI suggestion */}
          {aiAvailable && content.trim().length > 0 && (
            <Button
              size="$3"
              icon={suggestingTags ? <Spinner size="small" /> : <Sparkles size={16} color="$gray10" />}
              disabled={suggestingTags}
              backgroundColor="$backgroundStrong"
              borderRadius={9999}
              color="$gray10"
              fontFamily="$body"
              pressStyle={{ opacity: 0.7 }}
              onPress={async () => {
                setSuggestingTags(true);
                try {
                  const suggested = await aiSuggestTags(content);
                  for (const tag of suggested) {
                    addTag(tag);
                  }
                } catch {
                  // AI unavailable
                } finally {
                  setSuggestingTags(false);
                }
              }}
            >
              Suggest Vibes
            </Button>
          )}
        </YStack>

        {/* Action buttons */}
        <YStack paddingHorizontal={24} marginTop="$6" marginBottom="$4" gap="$3">
          <LinearGradient
            colors={hasContent ? ['#ffb77d', '#6e3900'] : ['#2e3c4f', '#1a2a3f']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.completeButton}
          >
            <Button
              unstyled
              onPress={handleDone}
              pressStyle={{ opacity: 0.8, scale: 0.95 }}
              paddingHorizontal="$5"
              paddingVertical="$3"
              width="100%"
              alignItems="center"
            >
              <Text
                fontFamily="$body"
                fontWeight="700"
                fontSize="$4"
                color={hasContent ? '#643400' : '$gray8'}
              >
                Done
              </Text>
            </Button>
          </LinearGradient>

          {hasContent && (
            <Button
              unstyled
              onPress={handleAddAnother}
              pressStyle={{ opacity: 0.7 }}
              paddingVertical="$3"
              alignItems="center"
            >
              <Text
                fontFamily="$body"
                fontWeight="600"
                fontSize="$3"
                color="$gray10"
              >
                Add Another Dream
              </Text>
            </Button>
          )}
        </YStack>
      </ScrollView>
        <LinearGradient
          colors={themeColors.topFade}
          pointerEvents="none"
          style={styles.topFade}
        />
        <LinearGradient
          colors={themeColors.bottomFade}
          pointerEvents="none"
          style={styles.bottomFade}
        />
      </View>

      {Platform.OS === 'ios' && (
        <InputAccessoryView nativeID={DONE_BAR_ID}>
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
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
    paddingTop: 16,
  },
  datePicker: {
    alignSelf: 'flex-start',
  },
  glassCard: {
    borderRadius: 16,
  },
  glassInput: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 16,
    lineHeight: 24,
    minHeight: 150,
  },
  secondaryInput: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 15,
    lineHeight: 22,
    borderBottomWidth: 1,
    paddingVertical: 8,
  },
  notesInput: {
    minHeight: 60,
    fontStyle: 'italic',
  },
  tagInput: {
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
  topFade: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 20,
  },
  bottomFade: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 36,
  },
  tagSuggestion: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
  },
  completeButton: {
    borderRadius: 16,
    overflow: 'hidden',
  },
});
