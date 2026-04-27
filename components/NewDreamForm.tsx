import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ScrollView, StyleSheet, TextInput, View, KeyboardAvoidingView, Platform, Pressable } from 'react-native';
import { Button, YStack, XStack, Text, Spinner } from 'tamagui';
import { X, Sparkles } from '@tamagui/lucide-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { addDream, setDreamTags, getRecentTags, searchTags, getOrCreateTag, getIntentionForDate, setIntention } from '../utils/database';
import { useRouter, useLocalSearchParams } from 'expo-router';
import type { Tag as TagType } from '../types';
import { useAI } from '../hooks/useAI';
import { GlassCard } from './GlassCard';
import DateTimePicker from '@react-native-community/datetimepicker';

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

  // Load intention for the selected date
  useEffect(() => {
    if (!params.prefillIntention) {
      const dateKey = formatDateKey(dreamDate);
      const existing = getIntentionForDate(dateKey);
      if (existing) {
        setIntentionText(existing.content);
      }
    }
  }, []);

  // When date changes, load that date's intention
  const handleDateChange = useCallback((_: any, date?: Date) => {
    if (!date) return;
    setDreamDate(date);
    const dateKey = formatDateKey(date);
    const existing = getIntentionForDate(dateKey);
    setIntentionText(existing?.content ?? '');
  }, []);

  useEffect(() => {
    setRecentTags(getRecentTags(15));
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

  const saveDream = useCallback(() => {
    if (!content.trim()) return null;
    const dateKey = formatDateKey(dreamDate);

    // Save intention for this date
    if (intention.trim()) {
      setIntention(dateKey, intention.trim());
    }

    // Save dream
    const dream = addDream(
      content.trim(),
      undefined,
      notes.trim() || undefined,
      dreamDate
    );
    if (selectedTags.length > 0) {
      setDreamTags(dream.id, selectedTags);
    }
    if (isFavorite) {
      const { toggleFavorite } = require('../utils/database');
      toggleFavorite(dream.id);
    }
    return dream;
  }, [content, dreamDate, intention, notes, selectedTags, isFavorite]);

  const handleComplete = () => {
    const dream = saveDream();
    if (dream) {
      router.back();
    }
  };

  const handleSaveAndAdd = () => {
    const dream = saveDream();
    if (dream) {
      // Push a fresh form with the same date and intention
      router.push({
        pathname: '/new-dream',
        params: {
          prefillDate: dreamDate.toISOString(),
          prefillIntention: intention,
        },
      });
    }
  };

  const canSubmit = content.trim().length > 0;

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
      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Date + Time picker */}
        <YStack paddingHorizontal={24}>
          <Text
            fontSize="$2"
            color="$gray10"
            fontFamily="$body"
            fontWeight="600"
            letterSpacing={1.5}
            textTransform="uppercase"
            marginBottom="$1"
          >
            Date & Time
          </Text>
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
            style={styles.secondaryInput}
            placeholder="What was your intention before sleep?"
            placeholderTextColor="#4e5c71"
            value={intention}
            onChangeText={setIntentionText}
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
              style={styles.glassInput}
              multiline
              placeholder="Describe your dream..."
              placeholderTextColor="#4e5c71"
              value={content}
              onChangeText={setContent}
              textAlignVertical="top"
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
              style={[styles.glassInput, styles.notesInput]}
              multiline
              placeholder="Record the deeper resonance..."
              placeholderTextColor="#4e5c71"
              value={notes}
              onChangeText={setNotes}
              textAlignVertical="top"
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
            style={styles.tagInput}
            placeholder="Search or add vibes..."
            placeholderTextColor="#4e5c71"
            value={tagQuery}
            onChangeText={setTagQuery}
            onSubmitEditing={() => {
              if (tagQuery.trim()) addTag(tagQuery);
            }}
            returnKeyType="done"
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
            colors={canSubmit ? ['#ffb77d', '#6e3900'] : ['#2e3c4f', '#1a2a3f']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.completeButton}
          >
            <Button
              unstyled
              onPress={handleComplete}
              disabled={!canSubmit}
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
                color={canSubmit ? '#643400' : '$gray8'}
              >
                Complete
              </Text>
            </Button>
          </LinearGradient>

          {canSubmit && (
            <Button
              unstyled
              onPress={handleSaveAndAdd}
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
                Save and Add Another Dream
              </Text>
            </Button>
          )}
        </YStack>
      </ScrollView>
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
    color: '#dae6ff',
    minHeight: 150,
  },
  secondaryInput: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 15,
    lineHeight: 22,
    color: '#dae6ff',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(33,72,125,0.15)',
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
    color: '#dae6ff',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(33,72,125,0.15)',
    paddingVertical: 8,
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
