import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from 'tamagui';
import { FlashList } from '@shopify/flash-list';

// Dummy data for dreams
export const dummyDreams = Array.from({ length: 20 }, (_, index) => ({
  id: index.toString(),
  title: `Dream ${index + 1}`,
  description: `This is a short description for dream ${
    index + 1
  }. It was a very interesting dream...`,
}));

const DreamItem = ({
  item,
}: {
  item: { title: string; description: string };
}) => (
  <View style={styles.dreamItem}>
    <Text fontWeight="bold">{item.title}</Text>
    <Text numberOfLines={2}>{item.description}</Text>
  </View>
);

interface NoteListProps {
  data?: typeof dummyDreams;
}

export const NoteList: React.FC<NoteListProps> = ({ data = dummyDreams }) => (
  <FlashList
    data={data}
    renderItem={({ item }) => <DreamItem item={item} />}
    estimatedItemSize={100}
    contentContainerStyle={styles.listContent}
  />
);

const styles = StyleSheet.create({
  listContent: {
    paddingVertical: 10,
  },
  dreamItem: {
    padding: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
  },
});
