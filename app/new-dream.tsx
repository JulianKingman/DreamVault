import React, { useState, useCallback } from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { Stack } from 'expo-router';
import { Bookmark } from '@tamagui/lucide-icons';
import { NewDreamForm } from '../components/NewDreamForm';
import { AtmosphericBackground } from '../components/AtmosphericBackground';

export default function NewDreamScreen() {
  const [isFavorite, setIsFavorite] = useState(false);
  const toggleFavorite = useCallback(() => setIsFavorite(prev => !prev), []);

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          presentation: 'modal',
          title: 'New Dream Entry',
          headerRight: () => (
            <Pressable
              onPress={toggleFavorite}
              hitSlop={12}
              style={({ pressed }) => [
                {
                  width: 36,
                  height: 36,
                  alignItems: 'center',
                  justifyContent: 'center',
                },
                pressed && { opacity: 0.7 },
              ]}
            >
              <Bookmark
                size={22}
                color={isFavorite ? '#ffb77d' : '#6b7d99'}
                fill={isFavorite ? '#ffb77d' : 'none'}
              />
            </Pressable>
          ),
        }}
      />
      <AtmosphericBackground />
      <NewDreamForm isFavorite={isFavorite} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
