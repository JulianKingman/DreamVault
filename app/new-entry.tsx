import React from 'react';
import { StyleSheet, SafeAreaView, View } from 'react-native';
import { Text } from 'tamagui';

export default function NewEntryScreen() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text fontSize="$8" fontWeight="bold">
          New Dream Entry
        </Text>
        <Text>Create your new dream entry here.</Text>
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
    alignItems: 'center',
    justifyContent: 'center',
  },
});
