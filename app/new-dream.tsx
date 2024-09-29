import React from 'react';
import { SafeAreaView } from 'react-native';
import { NewDreamForm } from '../components/NewDreamForm';

export default function NewDreamScreen() {
  return (
    <SafeAreaView style={{ flex: 1 }}>
      <NewDreamForm />
    </SafeAreaView>
  );
}
