import React, { useState } from 'react';
import {
  StyleSheet,
  SafeAreaView,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Text, YStack, Button } from 'tamagui';
import {
  ColorBridge,
  RichText,
  TenTapStartKit,
  Toolbar,
  useEditorBridge,
} from '@10play/tentap-editor';
import { InterFont } from '@/components/InterFont';

export default function NewEntryScreen() {
  const editor = useEditorBridge({
    autofocus: true,
    avoidIosKeyboard: true,
    dynamicHeight: true,
    initialContent: '',
    bridgeExtensions: [
      ...TenTapStartKit,
      ColorBridge.configureCSS(customCodeBlockCSS),
    ],
  });

  const handleSave = () => {
    // Implement save functionality here
    const content = editor.getHTML();
    console.log('Saving new entry:', { content });
  };

  return (
    <>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.container}>
          <YStack gap="$4" width="100%" height="100%">
            <RichText editor={editor} style={styles.editor} />
            <Button onPress={handleSave} theme="active">
              Save Dream
            </Button>
          </YStack>
        </ScrollView>
      </SafeAreaView>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
      >
        <Toolbar editor={editor} />
      </KeyboardAvoidingView>
    </>
  );
}

const customCodeBlockCSS = `
${InterFont}
* {
    font-family: Inter, sans-serif
}
code {
    border-radius: 0;
    border-color: #ccc;
    border: none;
    box-decoration-break: clone;
    color: #333;
    font-size: 0.9rem;
    padding: 0.25em;
}
`;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flexGrow: 1,
    // padding: 20,
    justifyContent: 'space-between',
  },
  editor: {
    height: 300,
    borderWidth: 1,
    borderColor: '$gray5',
    borderRadius: 8,
  },
  keyboardAvoidingView: {
    position: 'absolute',
    width: '100%',
    bottom: 0,
  },
});
