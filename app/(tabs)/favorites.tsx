import React from 'react';
import { StyleSheet, SafeAreaView, View } from 'react-native';
import { Text } from 'tamagui';
import { NoteList } from '../../components/NoteList';

export default function FavoritesScreen() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
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
  },
});
