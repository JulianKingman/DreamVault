import React, { useState, useEffect, useCallback } from 'react';
import { ScrollView, StyleSheet, TextInput, View, KeyboardAvoidingView, Platform } from 'react-native';
import { Button, YStack, XStack, Text, Spinner } from 'tamagui';
import { X, Sparkles, Star, Tag, Image as ImageIcon } from '@tamagui/lucide-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { addDream, setDreamTags, getAllTags } from '../utils/database';
import { useRouter } from 'expo-router';
import type { Tag as TagType } from '../types';
import { useAI } from '../hooks/useAI';
import { GlassCard } from './GlassCard';

export function NewDreamForm() {
  const [content, setContent] = useState('');
  const [intention, setIntention] = useState('');
  const [notes, setNotes] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [allTags, setAllTags] = useState<TagType[]>([]);
  const [showIntention, setShowIntention] = useState(false);
  const [showVibes, setShowVibes] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [suggestingTags, setSuggestingTags] = useState(false);
  const router = useRouter();
  const { available: aiAvailable, suggestTags: aiSuggestTags } = useAI();

  useEffect(() => {
    setAllTags(getAllTags());
  }, []);

  const addTag = useCallback((name: string) => {
    const trimmed = name.trim().toLowerCase();
    if (trimmed && !selectedTags.includes(trimmed)) {
      setSelectedTags(prev => [...prev, trimmed]);
    }
  }, [selectedTags]);

  const removeTag = useCallback((name: string) => {
    setSelectedTags(prev => prev.filter(t => t !== name));
  }, []);

  const toggleTag = useCallback((name: string) => {
    const trimmed = name.trim().toLowerCase();
    if (selectedTags.includes(trimmed)) {
      removeTag(trimmed);
    } else {
      addTag(trimmed);
    }
  }, [selectedTags, addTag, removeTag]);

  const handleSubmit = () => {
    if (content.trim()) {
      const dream = addDream(
        content.trim(),
        undefined, // no title
        intention.trim() || undefined,
        notes.trim() || undefined
      );
      if (selectedTags.length > 0) {
        setDreamTags(dream.id, selectedTags);
      }
      // TODO: handle isFavorite — toggle after creation
      setContent('');
      setIntention('');
      setNotes('');
      setSelectedTags([]);
      router.back();
    }
  };

  const canSubmit = content.trim().length > 0;

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
        {/* Main content area */}
        <View style={styles.writingArea}>
          <TextInput
            style={styles.contentInput}
            multiline
            placeholder="Describe your dream..."
            placeholderTextColor="#4e5c71"
            value={content}
            onChangeText={setContent}
            textAlignVertical="top"
          />
        </View>

        {/* Intention (collapsible) */}
        {showIntention && (
          <YStack paddingHorizontal={24} gap="$2" marginTop="$4">
            <XStack alignItems="center" justifyContent="space-between">
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
              <X size={16} color="$gray8" onPress={() => { setShowIntention(false); setIntention(''); }} />
            </XStack>
            <TextInput
              style={styles.secondaryInput}
              placeholder="What was your intention before sleep?"
              placeholderTextColor="#4e5c71"
              value={intention}
              onChangeText={setIntention}
            />
          </YStack>
        )}

        {/* Notes */}
        <YStack paddingHorizontal={24} gap="$2" marginTop="$4">
          <Text
            fontSize="$2"
            color="$gray10"
            fontFamily="$body"
            fontWeight="600"
            letterSpacing={1.5}
            textTransform="uppercase"
          >
            Notes
          </Text>
          <GlassCard style={styles.notesGlass} padding="$4">
            <TextInput
              style={styles.notesInput}
              multiline
              placeholder="Record the deeper resonance..."
              placeholderTextColor="#4e5c71"
              value={notes}
              onChangeText={setNotes}
              textAlignVertical="top"
            />
          </GlassCard>
        </YStack>

        {/* Selected tags display */}
        {selectedTags.length > 0 && (
          <XStack flexWrap="wrap" gap="$2" paddingHorizontal={24} marginTop="$3">
            {selectedTags.map(tag => (
              <XStack
                key={tag}
                backgroundColor="$gray6"
                borderRadius={9999}
                paddingHorizontal="$3"
                paddingVertical="$1.5"
                alignItems="center"
                gap="$1"
              >
                <Text
                  fontSize={10}
                  fontFamily="$body"
                  fontWeight="500"
                  letterSpacing={1}
                  textTransform="uppercase"
                  color="$gray10"
                >
                  {tag}
                </Text>
                <X size={12} color="$gray8" onPress={() => removeTag(tag)} />
              </XStack>
            ))}
          </XStack>
        )}

        {/* Vibes bottom sheet (inline for now) */}
        {showVibes && (
          <YStack paddingHorizontal={24} marginTop="$4" gap="$3">
            <XStack alignItems="center" justifyContent="space-between">
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
              <X size={16} color="$gray8" onPress={() => setShowVibes(false)} />
            </XStack>
            <XStack flexWrap="wrap" gap="$2">
              {allTags.map(tag => {
                const isSelected = selectedTags.includes(tag.name);
                return (
                  <XStack
                    key={tag.id}
                    backgroundColor={isSelected ? '$accentBackground' : '$gray6'}
                    borderRadius={9999}
                    paddingHorizontal="$4"
                    paddingVertical="$2"
                    pressStyle={{ opacity: 0.7 }}
                    onPress={() => toggleTag(tag.name)}
                  >
                    <Text
                      fontSize={12}
                      fontFamily="$body"
                      fontWeight="500"
                      color={isSelected ? '$accentColor' : '$gray10'}
                    >
                      {tag.name}
                    </Text>
                  </XStack>
                );
              })}
            </XStack>
            {/* AI suggestion within vibes */}
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
        )}
      </ScrollView>

      {/* Floating accessory bar */}
      <View style={styles.accessoryWrapper}>
        <GlassCard
          style={styles.accessoryGlass}
          flexDirection="row"
          alignItems="center"
          justifyContent="space-between"
          paddingHorizontal="$3"
          paddingVertical="$3"
        >
          <XStack alignItems="center" gap="$1">
            {/* Vibes toggle */}
            <Button
              unstyled
              onPress={() => setShowVibes(!showVibes)}
              pressStyle={{ opacity: 0.7 }}
              padding="$3"
              borderRadius={9999}
            >
              <Tag size={20} color={showVibes ? '$accentBackground' : '$gray10'} />
            </Button>

            {/* Favorite toggle */}
            <Button
              unstyled
              onPress={() => setIsFavorite(!isFavorite)}
              pressStyle={{ opacity: 0.7 }}
              padding="$3"
              borderRadius={9999}
            >
              <Star
                size={20}
                color={isFavorite ? '$accentBackground' : '$gray10'}
                fill={isFavorite ? '#ffb77d' : 'none'}
              />
            </Button>

            {/* Intention toggle */}
            {!showIntention && (
              <Button
                unstyled
                onPress={() => setShowIntention(true)}
                pressStyle={{ opacity: 0.7 }}
                padding="$3"
                borderRadius={9999}
              >
                <Text fontSize="$2" color="$gray10" fontFamily="$body" fontWeight="500">
                  + Intention
                </Text>
              </Button>
            )}
          </XStack>

          {/* Complete button */}
          <LinearGradient
            colors={canSubmit ? ['#ffb77d', '#6e3900'] : ['#2e3c4f', '#1a2a3f']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.completeButton}
          >
            <Button
              unstyled
              onPress={handleSubmit}
              disabled={!canSubmit}
              pressStyle={{ opacity: 0.8, scale: 0.95 }}
              paddingHorizontal="$5"
              paddingVertical="$2.5"
            >
              <Text
                fontFamily="$body"
                fontWeight="700"
                fontSize="$3"
                color={canSubmit ? '#643400' : '$gray8'}
              >
                Complete
              </Text>
            </Button>
          </LinearGradient>
        </GlassCard>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 120,
    paddingTop: 60,
  },
  writingArea: {
    paddingHorizontal: 24,
    minHeight: 250,
  },
  contentInput: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 18,
    lineHeight: 28,
    color: '#dae6ff',
    minHeight: 250,
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
  notesGlass: {
    borderRadius: 16,
  },
  notesInput: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 15,
    lineHeight: 22,
    color: '#dae6ff',
    minHeight: 60,
    fontStyle: 'italic',
  },
  accessoryWrapper: {
    position: 'absolute',
    bottom: 24,
    left: 16,
    right: 16,
  },
  accessoryGlass: {
    borderRadius: 9999,
  },
  completeButton: {
    borderRadius: 9999,
    overflow: 'hidden',
  },
});
