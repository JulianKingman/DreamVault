import React from 'react';
import { SafeAreaView, View, StyleSheet } from 'react-native';
import { NoteList } from '../../components/NoteList';
import { AtmosphericBackground } from '../../components/AtmosphericBackground';

export default function HomeScreen() {
  return (
    <View style={styles.container}>
      <AtmosphericBackground />
      <SafeAreaView style={styles.container}>
        <NoteList
          searchForm
          searchPosition="bottom"
        />
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
