import React from 'react';
import { View, StyleSheet } from 'react-native';
import { NewDreamForm } from '../components/NewDreamForm';
import { AtmosphericBackground } from '../components/AtmosphericBackground';

export default function NewDreamScreen() {
  return (
    <View style={styles.container}>
      <AtmosphericBackground />
      <NewDreamForm />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
