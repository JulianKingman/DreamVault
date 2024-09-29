import React, { useState } from 'react';
import { TextInput, StyleSheet } from 'react-native';
import { Button, YStack } from 'tamagui';
import type { Dream } from '../types';

interface NewDreamFormProps {
  onSubmit: (dream: Omit<Dream, 'id' | 'dateCreated' | 'dateModified'>) => void;
}

export function NewDreamForm({ onSubmit }: NewDreamFormProps) {
  const [content, setContent] = useState('');

  const handleSubmit = () => {
    if (content.trim()) {
      onSubmit({
        content: content.trim(),
      });
      setContent('');
    }
  };

  return (
    <YStack space>
      <TextInput
        style={styles.input}
        multiline
        placeholder="Describe your dream..."
        value={content}
        onChangeText={setContent}
      />
      <Button onPress={handleSubmit}>Save Dream</Button>
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
