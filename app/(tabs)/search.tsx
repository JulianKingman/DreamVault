import React from 'react';
import { StyleSheet, View } from 'react-native';
import { NoteList } from '../../components/NoteList';
import { AtmosphericBackground } from '../../components/AtmosphericBackground';

export default function SearchScreen() {
  return (
    <View style={styles.container}>
      <AtmosphericBackground />
      <NoteList searchForm autoFocusSearch />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
