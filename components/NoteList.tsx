import React, { useState, useCallback } from 'react';
import { FlatList, StyleSheet } from 'react-native';
import { Text, YStack, XStack, Separator, Input, Button } from 'tamagui';
import type { Dream } from '../types';

interface NoteListProps {
  dreams: Dream[];
  onSelectDream: (dream: Dream) => void;
  onAddDream: (content: string) => void;
  onUpdateDream: (dream: Dream) => void;
}

export function NoteList({
  dreams,
  onSelectDream,
  onAddDream,
  onUpdateDream,
}: NoteListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [newDreamContent, setNewDreamContent] = useState('');

  const filteredDreams = dreams.filter(dream =>
    dream.content.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const renderItem = useCallback(
    ({ item }: { item: Dream }) => {
      const title = item.content.split('\n')[0].trim();
      const truncatedTitle =
        title.length > 30 ? `${title.substring(0, 30)}...` : title;

      return (
        <YStack
          padding="$3"
          backgroundColor="$backgroundStrong"
          borderRadius="$2"
          marginBottom="$2"
          onPress={() => onSelectDream(item)}
        >
          <XStack justifyContent="space-between" alignItems="center">
            <Text fontSize="$5" fontWeight="bold" numberOfLines={1}>
              {truncatedTitle}
            </Text>
            <Text fontSize="$3" color="$gray10">
              {item.dateModified.toLocaleDateString()}
            </Text>
          </XStack>
          <Text fontSize="$4" numberOfLines={2} marginTop="$1">
            {item.content.substring(title.length).trim()}
          </Text>
        </YStack>
      );
    },
    [onSelectDream],
  );

  const handleAddDream = () => {
    if (newDreamContent.trim()) {
      onAddDream(newDreamContent.trim());
      setNewDreamContent('');
    }
  };

  return (
    <YStack flex={1}>
      <Input
        placeholder="Search dreams..."
        value={searchTerm}
        onChangeText={setSearchTerm}
        marginBottom="$2"
      />
      <Input
        placeholder="Enter new dream..."
        value={newDreamContent}
        onChangeText={setNewDreamContent}
        marginBottom="$2"
      />
      <Button onPress={handleAddDream} marginBottom="$2">
        Add Dream
      </Button>
      <FlatList
        data={filteredDreams}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        ItemSeparatorComponent={() => <Separator />}
        contentContainerStyle={styles.listContent}
      />
    </YStack>
  );
}

const styles = StyleSheet.create({
  listContent: {
    padding: 16,
  },
});
