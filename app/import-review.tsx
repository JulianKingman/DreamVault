import React, { useState, useEffect } from 'react';
import { SafeAreaView, StyleSheet, FlatList, Alert } from 'react-native';
import { YStack, XStack, Text, Input, Button, Checkbox, Separator } from 'tamagui';
import { useRouter } from 'expo-router';
import * as DocumentPicker from 'expo-document-picker';
import { parseMultipleFiles, type ImportedDream } from '../utils/importers';
import { addDreamBulk } from '../utils/database';
import { Check } from '@tamagui/lucide-icons';

export default function ImportReviewScreen() {
  const router = useRouter();
  const [imports, setImports] = useState<ImportedDream[]>([]);
  const [loading, setLoading] = useState(false);
  const [picked, setPicked] = useState(false);

  useEffect(() => {
    pickFiles();
  }, []);

  const pickFiles = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['text/plain', 'text/markdown', 'text/*'],
        multiple: true,
        copyToCacheDirectory: true,
      });

      if (result.canceled) {
        router.back();
        return;
      }

      const files = result.assets.map(a => ({ uri: a.uri, name: a.name }));
      const parsed = await parseMultipleFiles(files);
      setImports(parsed);
      setPicked(true);
    } catch (e) {
      Alert.alert('Error', 'Failed to read files.');
      router.back();
    }
  };

  const toggleSelection = (index: number) => {
    setImports(prev =>
      prev.map((item, i) =>
        i === index ? { ...item, selected: !item.selected } : item
      )
    );
  };

  const updateTitle = (index: number, title: string) => {
    setImports(prev =>
      prev.map((item, i) => (i === index ? { ...item, title } : item))
    );
  };

  const handleImport = () => {
    const selected = imports.filter(i => i.selected);
    if (selected.length === 0) {
      Alert.alert('No items selected', 'Select at least one dream to import.');
      return;
    }

    setLoading(true);
    try {
      addDreamBulk(
        selected.map(i => ({
          content: i.content,
          title: i.title || undefined,
          dateCreated: i.dateCreated ?? undefined,
        }))
      );
      Alert.alert('Success', `Imported ${selected.length} dream(s).`, [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (e) {
      Alert.alert('Error', 'Failed to import dreams.');
    } finally {
      setLoading(false);
    }
  };

  if (!picked) {
    return (
      <SafeAreaView style={styles.container}>
        <YStack flex={1} alignItems="center" justifyContent="center">
          <Text>Selecting files...</Text>
        </YStack>
      </SafeAreaView>
    );
  }

  if (imports.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <YStack flex={1} alignItems="center" justifyContent="center" space="$4">
          <Text>No files selected</Text>
          <Button onPress={() => router.back()}>Go Back</Button>
        </YStack>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <YStack flex={1} padding="$4" space="$4">
        <Text fontSize="$6" fontWeight="bold">
          Review Imports ({imports.filter(i => i.selected).length}/{imports.length})
        </Text>

        <FlatList
          data={imports}
          keyExtractor={(_, i) => String(i)}
          ItemSeparatorComponent={() => <Separator marginVertical="$2" />}
          renderItem={({ item, index }) => (
            <XStack space="$3" alignItems="flex-start" padding="$2">
              <Checkbox
                checked={item.selected}
                onCheckedChange={() => toggleSelection(index)}
                size="$4"
                marginTop="$1"
              >
                <Checkbox.Indicator>
                  <Check size={16} />
                </Checkbox.Indicator>
              </Checkbox>
              <YStack flex={1} space="$1">
                <Input
                  size="$3"
                  value={item.title}
                  onChangeText={(t: string) => updateTitle(index, t)}
                  placeholder="Title"
                />
                <Text fontSize="$3" numberOfLines={3} color="$gray11">
                  {item.content}
                </Text>
                {item.dateCreated && (
                  <Text fontSize="$2" color="$gray10">
                    Detected date: {new Date(item.dateCreated).toLocaleDateString()}
                  </Text>
                )}
              </YStack>
            </XStack>
          )}
        />

        <Button
          theme="active"
          onPress={handleImport}
          disabled={loading}
        >
          {loading ? 'Importing...' : `Import ${imports.filter(i => i.selected).length} Dream(s)`}
        </Button>
      </YStack>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
