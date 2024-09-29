import React, { useState } from 'react';
import { StyleSheet } from 'react-native';
import { Button, YStack, Input } from 'tamagui';
import { addDream } from '../utils/database';
import { useRouter } from 'expo-router';

export function NewDreamForm() {
  const [content, setContent] = useState('');
  const router = useRouter();

  const handleSubmit = () => {
    if (content.trim()) {
      addDream(content.trim());
      setContent('');
      router.back(); // Go back to the previous screen after adding the dream
    }
  };

  return (
    <YStack space="$4" padding="$4">
      <Input
        size="$4"
        multiline
        numberOfLines={4}
        placeholder="Describe your dream..."
        value={content}
        onChangeText={setContent}
      />
      <Button onPress={handleSubmit} theme="active">
        Save Dream
      </Button>
    </YStack>
  );
}

const styles = StyleSheet.create({
  input: {
    height: 200,
    borderColor: 'gray',
    borderWidth: 1,
    padding: 10,
  },
});
