import React from 'react';
import { StyleSheet, View } from 'react-native';
import { NoteList } from '../../components/NoteList';
import { AtmosphericBackground } from '../../components/AtmosphericBackground';

export default function FavoritesScreen() {
  return (
    <View style={styles.container}>
      <AtmosphericBackground />
      <NoteList favoritesOnly />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
