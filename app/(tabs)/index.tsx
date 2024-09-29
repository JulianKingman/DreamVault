import React from 'react';
import { SafeAreaView } from 'react-native';
import { NoteList } from '../../components/NoteList';

export default function HomeScreen() {
  return (
    <SafeAreaView style={{ flex: 1 }}>
      <NoteList />
    </SafeAreaView>
  );
}
