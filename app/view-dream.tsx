import React, { useState, useEffect } from 'react';
import { SafeAreaView, StyleSheet, Alert, ScrollView, View, Share, TextInput } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { YStack, Text, Input, Button, XStack } from 'tamagui';
import { getDreamById, updateDream, toggleFavorite, deleteDream, setDreamTags, getAllTags } from '../utils/database';
import type { Dream, Tag } from '../types';
import { Star, Trash2, X, Edit3, Share2, ChevronLeft, Compass } from '@tamagui/lucide-icons';
import { AIInsights } from '../components/AIInsights';
import { AtmosphericBackground } from '../components/AtmosphericBackground';
import { GlassCard } from '../components/GlassCard';

export default function ViewDreamScreen() {
  const { dreamId } = useLocalSearchParams<{ dreamId: string }>();
  const router = useRouter();
  const [dream, setDream] = useState<Dream | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState('');
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
        title: dream.title,
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
            if (dream.intention) message += `\n\nIntention: ${dream.intention}`;
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
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Back button */}
          <XStack paddingHorizontal="$4" paddingTop="$2">
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

          {isEditing ? (
            // Edit mode
            <YStack padding="$5" gap="$4">
              <TextInput
                style={styles.editContent}
                multiline
                value={editedContent}
                onChangeText={setEditedContent}
                placeholder="Dream content..."
                placeholderTextColor="#4e5c71"
              />

              <YStack gap="$2">
                <XStack alignItems="center" gap="$2">
                  <Compass size={14} color="$gray10" />
                  <Text fontSize="$2" color="$gray10" fontFamily="$body" letterSpacing={1.5} textTransform="uppercase">
                    Intention
                  </Text>
                </XStack>
                <TextInput
                  style={styles.editField}
                  value={editedIntention}
                  onChangeText={setEditedIntention}
                  placeholder="What was your intention before sleep?"
                  placeholderTextColor="#4e5c71"
                />
              </YStack>

              <YStack gap="$2">
                <Text fontSize="$2" color="$gray10" fontFamily="$body" letterSpacing={1.5} textTransform="uppercase">
                  Notes
                </Text>
                <TextInput
                  style={[styles.editField, { minHeight: 80 }]}
                  multiline
                  value={editedNotes}
                  onChangeText={setEditedNotes}
                  placeholder="Any additional thoughts..."
                  placeholderTextColor="#4e5c71"
                />
              </YStack>

              {/* Tag editing */}
              <YStack gap="$2">
                <Text fontSize="$2" color="$gray10" fontFamily="$body" letterSpacing={1.5} textTransform="uppercase">
                  Vibes
                </Text>
                <TextInput
                  style={styles.editField}
                  value={tagInput}
                  onChangeText={setTagInput}
                  placeholder="Add vibes..."
                  placeholderTextColor="#4e5c71"
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

              <XStack gap="$3" marginTop="$2">
                <Button
                  flex={1}
                  onPress={() => setIsEditing(false)}
                  backgroundColor="$backgroundStrong"
                  borderRadius={9999}
                  fontFamily="$body"
                >
                  Cancel
                </Button>
                <Button
                  flex={1}
                  onPress={handleSave}
                  backgroundColor="$accentBackground"
                  color="$accentColor"
                  borderRadius={9999}
                  fontFamily="$body"
                  fontWeight="600"
                >
                  Save
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

              {/* Dream content */}
              <Text
                fontFamily="$heading"
                fontSize="$7"
                lineHeight={32}
                color="$color"
              >
                {dream.content}
              </Text>

              {/* Intention */}
              {dream.intention && (
                <YStack
                  backgroundColor="$backgroundStrong"
                  borderRadius={20}
                  padding="$4"
                  gap="$2"
                >
                  <XStack alignItems="center" gap="$2">
                    <Compass size={14} color="$gray10" />
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
                  </XStack>
                  <Text fontFamily="$body" fontSize="$4" lineHeight={22} color="$color">
                    {dream.intention}
                  </Text>
                </YStack>
              )}

              {/* Notes */}
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
                    Notes
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
                  <Star
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
                    {dream.isFavorite ? 'Saved' : 'Save'}
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
    color: '#dae6ff',
    minHeight: 200,
    textAlignVertical: 'top',
  },
  editField: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 15,
    lineHeight: 22,
    color: '#dae6ff',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(33,72,125,0.15)',
    paddingVertical: 8,
  },
});
