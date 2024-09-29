import React from 'react';
import { SafeAreaView } from 'react-native';
import { NoteList } from '../../components/NoteList';
import { getDreams, addDream, updateDream } from '../../utils/database';

export default function HomeScreen() {
  return (
    <SafeAreaView style={{ flex: 1 }}>
      <NoteList
        dreams={getDreams()}
        onSelectDream={console.log} // Temporary, replace with actual navigation logic
        onAddDream={addDream}
        onUpdateDream={updateDream}
      />
    </SafeAreaView>
  );
}
