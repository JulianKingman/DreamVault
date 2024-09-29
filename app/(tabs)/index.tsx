import React from 'react';
import { StyleSheet, SafeAreaView, View } from 'react-native';
import { Text } from 'tamagui';
import { NoteList } from '../../components/NoteList';

export default function RecentScreen() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text fontSize="$8" fontWeight="bold" marginBottom="$4">
          Recent Dreams
        </Text>
        <NoteList />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
    padding: 20,
  },
});
