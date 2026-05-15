import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { NoteList } from '../../components/NoteList';
import { AtmosphericBackground } from '../../components/AtmosphericBackground';
import { FloatingSearchBar } from '../../components/FloatingSearchBar';

export default function HomeScreen() {
  const [searchTerm, setSearchTerm] = useState('');

  return (
    <View style={styles.container}>
      <AtmosphericBackground />
      <NoteList externalSearch={searchTerm} />
      <FloatingSearchBar value={searchTerm} onChangeText={setSearchTerm} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
