import React, { useState, useEffect } from 'react';
import { SafeAreaView, StyleSheet, Alert, ScrollView } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { YStack, Text, Input, Button, XStack } from 'tamagui';
import { getDreamById, updateDream, toggleFavorite, deleteDream, setDreamTags, getAllTags } from '../utils/database';
import type { Dream, Tag } from '../types';
import { Star, Trash2, X } from '@tamagui/lucide-icons';
import { AIInsights } from '../components/AIInsights';

export default function ViewDreamScreen() {
  const { dreamId } = useLocalSearchParams<{ dreamId: string }>();
  const router = useRouter();
  const [dream, setDream] = useState<Dream | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState('');
  const [editedTitle, setEditedTitle] = useState('');
  const [editedIntention, setEditedIntention] = useState('');
  const [editedNotes, setEditedNotes] = useState('');
  const [editedTags, setEditedTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [allTags, setAllTags] = useState<Tag[]>([]);

  useEffect(() => {
    if (dreamId) {
      const fetched = getDreamById(Number(dreamId));
      if (fetched) {
        setDream(fetched);
        setEditedContent(fetched.content);
        setEditedTitle(fetched.title ?? '');
        setEditedIntention(fetched.intention ?? '');
        setEditedNotes(fetched.notes ?? '');
        setEditedTags(fetched.tags?.map(t => t.name) ?? []);
      }
    }
    setAllTags(getAllTags());
  }, [dreamId]);

  const startEditing = () => {
    if (!dream) return;
    setEditedContent(dream.content);
    setEditedTitle(dream.title ?? '');
    setEditedIntention(dream.intention ?? '');
    setEditedNotes(dream.notes ?? '');
    setEditedTags(dream.tags?.map(t => t.name) ?? []);
    setIsEditing(true);
  };

  const handleSave = () => {
    if (dream && editedContent.trim()) {
      const updatedDream = {
        ...dream,
        content: editedContent.trim(),
        title: editedTitle.trim() || null,
        intention: editedIntention.trim() || null,
        notes: editedNotes.trim() || null,
      };
      updateDream(updatedDream);
      const tags = setDreamTags(dream.id, editedTags);
      setDream({ ...updatedDream, tags });
      setIsEditing(false);
    }
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
      <SafeAreaView style={styles.container}>
        <Text>Dream not found</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <YStack space="$4" padding="$4">
          <XStack justifyContent="space-between" alignItems="center">
            <Text fontSize="$6" fontWeight="bold">
              {dream.title || new Date(dream.dateCreated).toLocaleDateString()}
            </Text>
            <XStack space="$2">
              <Button
                icon={<Trash2 size="$1" color="$red10" />}
                onPress={handleDelete}
                unstyled
              />
              <Button
                icon={
                  <Star
                    size="$1"
                    color={dream.isFavorite ? '$yellow10' : '$gray10'}
                  />
                }
                onPress={handleToggleFavorite}
                unstyled
              />
            </XStack>
          </XStack>

          {dream.title && (
            <Text fontSize="$3" color="$gray10">
              {new Date(dream.dateCreated).toLocaleDateString(undefined, {
                weekday: 'long',
                year: 'numeric',
                month: 'short',
                day: 'numeric',
              })}
            </Text>
          )}

          {isEditing ? (
            <YStack space="$3">
              <Input
                size="$4"
                placeholder="Title (optional)"
                value={editedTitle}
                onChangeText={setEditedTitle}
              />
              <Input
                size="$4"
                multiline
                numberOfLines={8}
                value={editedContent}
                onChangeText={setEditedContent}
              />
              <Input
                size="$4"
                placeholder="Intention (optional)"
                value={editedIntention}
                onChangeText={setEditedIntention}
              />
              <Input
                size="$4"
                multiline
                numberOfLines={3}
                placeholder="Notes (optional)"
                value={editedNotes}
                onChangeText={setEditedNotes}
              />

              {/* Tag editing */}
              <YStack space="$2">
                <Input
                  size="$4"
                  placeholder="Add tags..."
                  value={tagInput}
                  onChangeText={setTagInput}
                  onSubmitEditing={() => {
                    if (tagInput.trim()) addTag(tagInput);
                  }}
                />
                {filteredSuggestions.length > 0 && (
                  <YStack backgroundColor="$backgroundStrong" borderRadius="$2" padding="$2">
                    {filteredSuggestions.map(tag => (
                      <Text
                        key={tag.id}
                        padding="$2"
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
                        backgroundColor="$blue4"
                        borderRadius="$4"
                        paddingHorizontal="$3"
                        paddingVertical="$1"
                        alignItems="center"
                        space="$1"
                      >
                        <Text fontSize="$3">{tag}</Text>
                        <X size={14} onPress={() => removeTag(tag)} />
                      </XStack>
                    ))}
                  </XStack>
                )}
              </YStack>

              <XStack space="$4">
                <Button flex={1} onPress={() => setIsEditing(false)}>
                  Cancel
                </Button>
                <Button flex={1} theme="active" onPress={handleSave}>
                  Save
                </Button>
              </XStack>
            </YStack>
          ) : (
            <YStack space="$3">
              {dream.intention && (
                <YStack space="$1">
                  <Text fontSize="$3" color="$gray10" fontWeight="bold">
                    Intention
                  </Text>
                  <Text>{dream.intention}</Text>
                </YStack>
              )}

              <Text>{dream.content}</Text>

              {dream.notes && (
                <YStack space="$1">
                  <Text fontSize="$3" color="$gray10" fontWeight="bold">
                    Notes
                  </Text>
                  <Text>{dream.notes}</Text>
                </YStack>
              )}

              {dream.tags && dream.tags.length > 0 && (
                <XStack flexWrap="wrap" gap="$2">
                  {dream.tags.map(tag => (
                    <XStack
                      key={tag.id}
                      backgroundColor="$blue4"
                      borderRadius="$4"
                      paddingHorizontal="$3"
                      paddingVertical="$1"
                    >
                      <Text fontSize="$3">{tag.name}</Text>
                    </XStack>
                  ))}
                </XStack>
              )}

              <AIInsights
                content={dream.content}
                onSuggestTags={(newTags) => {
                  const currentTags = dream.tags?.map(t => t.name) ?? [];
                  const merged = [...new Set([...currentTags, ...newTags])];
                  const tags = setDreamTags(dream.id, merged);
                  setDream({ ...dream, tags });
                }}
              />

              <Button onPress={startEditing}>Edit</Button>
            </YStack>
          )}
          <Button onPress={() => router.back()}>Back to List</Button>
        </YStack>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
