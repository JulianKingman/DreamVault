import React, { useState, useEffect } from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { Button, YStack, XStack, Input, Text, Spinner, TextArea } from 'tamagui';
import { X, Sparkles, Moon } from '@tamagui/lucide-icons';
import { addDream, setDreamTags, getAllTags } from '../utils/database';
import { useRouter } from 'expo-router';
import type { Tag } from '../types';
import { useAI } from '../hooks/useAI';

const inputStyle = {
  backgroundColor: '$backgroundHover',
  borderColor: '$borderColor',
  borderWidth: 1,
  color: '$color',
  placeholderTextColor: '$placeholderColor',
  focusStyle: {
    borderColor: '$borderColorFocus',
    backgroundColor: '$backgroundFocus',
  },
} as const;

export function NewDreamForm() {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [intention, setIntention] = useState('');
  const [notes, setNotes] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [allTags, setAllTags] = useState<Tag[]>([]);
  const [suggestingTags, setSuggestingTags] = useState(false);
  const router = useRouter();
  const { available: aiAvailable, suggestTags: aiSuggestTags } = useAI();

  useEffect(() => {
    setAllTags(getAllTags());
  }, []);

  const filteredSuggestions = tagInput.trim()
    ? allTags
        .filter(
          t =>
            t.name.includes(tagInput.trim().toLowerCase()) &&
            !selectedTags.includes(t.name)
        )
        .slice(0, 5)
    : [];

  const addTag = (name: string) => {
    const trimmed = name.trim().toLowerCase();
    if (trimmed && !selectedTags.includes(trimmed)) {
      setSelectedTags(prev => [...prev, trimmed]);
    }
    setTagInput('');
  };

  const removeTag = (name: string) => {
    setSelectedTags(prev => prev.filter(t => t !== name));
  };

  const handleSubmit = () => {
    if (content.trim()) {
      const dream = addDream(
        content.trim(),
        title.trim() || undefined,
        intention.trim() || undefined,
        notes.trim() || undefined
      );
      if (selectedTags.length > 0) {
        setDreamTags(dream.id, selectedTags);
      }
      setTitle('');
      setContent('');
      setIntention('');
      setNotes('');
      setSelectedTags([]);
      router.back();
    }
  };

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
      <YStack gap="$4" padding="$4">
        {/* Title */}
        <YStack gap="$1.5">
          <Text fontSize="$2" color="$gray10" fontWeight="600" textTransform="uppercase" letterSpacing={1}>
            Title
          </Text>
          <Input
            size="$4"
            placeholder="Give your dream a name..."
            value={title}
            onChangeText={setTitle}
            borderRadius="$3"
            {...inputStyle}
          />
        </YStack>

        {/* Dream content */}
        <YStack gap="$1.5">
          <Text fontSize="$2" color="$gray10" fontWeight="600" textTransform="uppercase" letterSpacing={1}>
            Dream
          </Text>
          <TextArea
            size="$4"
            numberOfLines={8}
            placeholder="Describe your dream..."
            value={content}
            onChangeText={setContent}
            borderRadius="$3"
            minHeight={160}
            verticalAlign="top"
            {...inputStyle}
          />
        </YStack>

        {/* Intention */}
        <YStack gap="$1.5">
          <Text fontSize="$2" color="$gray10" fontWeight="600" textTransform="uppercase" letterSpacing={1}>
            Intention
          </Text>
          <Input
            size="$4"
            placeholder="What was your intention before sleep?"
            value={intention}
            onChangeText={setIntention}
            borderRadius="$3"
            {...inputStyle}
          />
        </YStack>

        {/* Notes */}
        <YStack gap="$1.5">
          <Text fontSize="$2" color="$gray10" fontWeight="600" textTransform="uppercase" letterSpacing={1}>
            Notes
          </Text>
          <TextArea
            size="$4"
            numberOfLines={3}
            placeholder="Any additional thoughts or feelings..."
            value={notes}
            onChangeText={setNotes}
            borderRadius="$3"
            minHeight={90}
            verticalAlign="top"
            {...inputStyle}
          />
        </YStack>

        {/* Tags */}
        <YStack gap="$2">
          <Text fontSize="$2" color="$gray10" fontWeight="600" textTransform="uppercase" letterSpacing={1}>
            Tags
          </Text>
          <Input
            size="$4"
            placeholder="Type a tag and press enter..."
            value={tagInput}
            onChangeText={setTagInput}
            onSubmitEditing={() => {
              if (tagInput.trim()) addTag(tagInput);
            }}
            borderRadius="$3"
            {...inputStyle}
          />
          {filteredSuggestions.length > 0 && (
            <YStack
              backgroundColor="$backgroundStrong"
              borderRadius="$3"
              borderColor="$borderColor"
              borderWidth={1}
              padding="$1"
            >
              {filteredSuggestions.map(tag => (
                <Text
                  key={tag.id}
                  padding="$2"
                  paddingHorizontal="$3"
                  color="$color"
                  borderRadius="$2"
                  pressStyle={{ backgroundColor: '$backgroundPress' }}
                  onPress={() => addTag(tag.name)}
                >
                  {tag.name}
                </Text>
              ))}
            </YStack>
          )}
          {selectedTags.length > 0 && (
            <XStack flexWrap="wrap" gap="$2">
              {selectedTags.map(tag => (
                <XStack
                  key={tag}
                  backgroundColor="$purple4"
                  borderColor="$purple6"
                  borderWidth={1}
                  borderRadius="$6"
                  paddingHorizontal="$3"
                  paddingVertical="$1.5"
                  alignItems="center"
                  gap="$1.5"
                >
                  <Text fontSize="$3" color="$purple10">{tag}</Text>
                  <X size={14} color="$purple8" onPress={() => removeTag(tag)} />
                </XStack>
              ))}
            </XStack>
          )}
        </YStack>

        {/* AI tag suggestion */}
        {aiAvailable && content.trim().length > 0 && (
          <Button
            size="$3"
            icon={suggestingTags ? <Spinner size="small" /> : <Sparkles size={16} color="$purple10" />}
            disabled={suggestingTags}
            backgroundColor="$purple3"
            borderColor="$purple5"
            borderWidth={1}
            borderRadius="$3"
            color="$purple10"
            pressStyle={{ backgroundColor: '$purple5' }}
            onPress={async () => {
              setSuggestingTags(true);
              try {
                const suggested = await aiSuggestTags(content);
                for (const tag of suggested) {
                  addTag(tag);
                }
              } catch {
                // AI unavailable, silently skip
              } finally {
                setSuggestingTags(false);
              }
            }}
          >
            Suggest Tags
          </Button>
        )}

        {/* Save button */}
        <Button
          size="$5"
          onPress={handleSubmit}
          backgroundColor={content.trim() ? '$purple9' : '$backgroundHover'}
          color={content.trim() ? '#fff' : '$gray8'}
          borderRadius="$4"
          fontWeight="700"
          fontSize="$5"
          marginTop="$2"
          pressStyle={{ backgroundColor: '$purple8' }}
          icon={<Moon size={18} color={content.trim() ? '#fff' : '$gray8'} />}
        >
          Save Dream
        </Button>
      </YStack>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
});
