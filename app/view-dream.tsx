import React, { useState, useEffect } from 'react';
import { SafeAreaView, StyleSheet } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { YStack, Text, Input, Button, XStack } from 'tamagui';
import { getDreams, updateDream, toggleFavorite } from '../utils/database';
import type { Dream } from '../types';
import { Star } from '@tamagui/lucide-icons';

export default function ViewDreamScreen() {
  const { dreamId } = useLocalSearchParams<{ dreamId: string }>();
  const router = useRouter();
  const [dream, setDream] = useState<Dream | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState('');

  useEffect(() => {
    if (dreamId) {
      const fetchedDream = getDreams().find(d => d.id === Number(dreamId));
      if (fetchedDream) {
        setDream(fetchedDream);
        setEditedContent(fetchedDream.content);
      }
    }
  }, [dreamId]);

  const handleSave = () => {
    if (dream && editedContent.trim()) {
      const updatedDream = { ...dream, content: editedContent.trim() };
      updateDream(updatedDream);
      setDream(updatedDream);
      setIsEditing(false);
    }
  };

  const handleToggleFavorite = () => {
    if (dream) {
      toggleFavorite(dream.id);
      setDream({ ...dream, isFavorite: !dream.isFavorite });
    }
  };

  if (!dream) {
    return (
      <SafeAreaView style={styles.container}>
        <Text>Dream not found</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <YStack space="$4" padding="$4">
        <XStack justifyContent="space-between" alignItems="center">
          <Text fontSize="$6" fontWeight="bold">
            {new Date(dream.dateCreated).toLocaleDateString()}
          </Text>
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
        {isEditing ? (
          <>
            <Input
              multiline
              numberOfLines={10}
              value={editedContent}
              onChangeText={setEditedContent}
            />
            <XStack space="$4">
              <Button flex={1} onPress={() => setIsEditing(false)}>
                Cancel
              </Button>
              <Button flex={1} theme="active" onPress={handleSave}>
                Save
              </Button>
            </XStack>
          </>
        ) : (
          <>
            <Text>{dream.content}</Text>
            <Button onPress={() => setIsEditing(true)}>Edit</Button>
          </>
        )}
        <Button onPress={() => router.back()}>Back to List</Button>
      </YStack>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
