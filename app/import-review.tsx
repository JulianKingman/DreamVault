import React, { useState, useEffect } from 'react';
import { SafeAreaView, StyleSheet, FlatList, Alert, View, Animated } from 'react-native';
import { YStack, XStack, Text, Button, Checkbox, Spinner } from 'tamagui';
import { useRouter } from 'expo-router';
import * as DocumentPicker from 'expo-document-picker';
import { parseMultipleFiles, type ImportedDream } from '../utils/importers';
import { addDreamBulk } from '../utils/database';
import { Check, FileText, FolderOpen, Shield } from '@tamagui/lucide-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { AtmosphericBackground } from '../components/AtmosphericBackground';

export default function ImportReviewScreen() {
  const router = useRouter();
  const [imports, setImports] = useState<ImportedDream[]>([]);
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
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

  const handleImport = () => {
    const selected = imports.filter(i => i.selected);
    if (selected.length === 0) {
      Alert.alert('No items selected', 'Select at least one dream to import.');
      return;
    }

    setImporting(true);
    setLoading(true);

    // Simulate progress
    const interval = setInterval(() => {
      setImportProgress(prev => {
        if (prev >= 0.9) {
          clearInterval(interval);
          return prev;
        }
        return prev + 0.1;
      });
    }, 200);

    try {
      addDreamBulk(
        selected.map(i => ({
          content: i.content,
          title: i.title || undefined,
          dateCreated: i.dateCreated ?? undefined,
        }))
      );
      clearInterval(interval);
      setImportProgress(1);
      Alert.alert('Success', `Imported ${selected.length} dream(s).`, [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (e) {
      clearInterval(interval);
      Alert.alert('Error', 'Failed to import dreams.');
    } finally {
      setLoading(false);
      setImporting(false);
    }
  };

  const selectedCount = imports.filter(i => i.selected).length;

  if (!picked) {
    return (
      <View style={styles.container}>
        <AtmosphericBackground />
        <SafeAreaView style={styles.centered}>
          <Spinner size="large" color="$accentBackground" />
          <Text color="$gray10" fontFamily="$body" marginTop="$4">
            Selecting files...
          </Text>
        </SafeAreaView>
      </View>
    );
  }

  if (imports.length === 0) {
    return (
      <View style={styles.container}>
        <AtmosphericBackground />
        <SafeAreaView style={styles.centered}>
          <Text fontFamily="$body" color="$color" fontSize="$5">
            No dreams found in selected files
          </Text>
          <Button
            onPress={() => router.back()}
            backgroundColor="$backgroundStrong"
            borderRadius={9999}
            fontFamily="$body"
            marginTop="$4"
          >
            Go Back
          </Button>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <AtmosphericBackground />
      <SafeAreaView style={styles.container}>
        <YStack flex={1} padding="$4" gap="$4">
          {/* Header */}
          <YStack gap="$2">
            <Text fontFamily="$heading" fontSize="$8" color="$color">
              Import Dreams
            </Text>
            <Text fontFamily="$body" fontSize="$3" color="$gray10">
              {selectedCount} of {imports.length} selected
            </Text>
          </YStack>

          {/* Source info */}
          <XStack
            backgroundColor="$backgroundStrong"
            borderRadius={16}
            padding="$3"
            alignItems="center"
            gap="$3"
          >
            <FolderOpen size={18} color="$gray10" />
            <Text flex={1} fontFamily="$body" fontSize="$3" color="$gray10">
              Markdown &amp; text files
            </Text>
            <XStack alignItems="center" gap="$1">
              <Shield size={14} color="$gray10" />
              <Text fontFamily="$body" fontSize="$2" color="$gray10">
                Processed locally
              </Text>
            </XStack>
          </XStack>

          {/* Progress bar (during import) */}
          {importing && (
            <YStack gap="$2">
              <View style={styles.progressTrack}>
                <View style={[styles.progressFill, { width: `${importProgress * 100}%` }]} />
              </View>
              <Text fontFamily="$body" fontSize="$2" color="$gray10" textAlign="center">
                Importing...
              </Text>
            </YStack>
          )}

          {/* Dream list */}
          <FlatList
            data={imports}
            keyExtractor={(_, i) => String(i)}
            contentContainerStyle={styles.listContent}
            renderItem={({ item, index }) => (
              <XStack
                backgroundColor="$backgroundStrong"
                borderRadius={16}
                padding="$3"
                marginBottom="$2"
                gap="$3"
                alignItems="flex-start"
                pressStyle={{ opacity: 0.8 }}
                onPress={() => toggleSelection(index)}
              >
                <Checkbox
                  checked={item.selected}
                  onCheckedChange={() => toggleSelection(index)}
                  size="$4"
                  marginTop="$1"
                  borderRadius={8}
                >
                  <Checkbox.Indicator>
                    <Check size={16} />
                  </Checkbox.Indicator>
                </Checkbox>
                <YStack flex={1} gap="$1">
                  <Text
                    fontFamily="$heading"
                    fontSize="$4"
                    numberOfLines={2}
                    color="$color"
                  >
                    {item.content}
                  </Text>
                  {item.dateCreated && (
                    <Text
                      fontSize="$2"
                      color="$gray10"
                      fontFamily="$body"
                      letterSpacing={1}
                      textTransform="uppercase"
                    >
                      {new Date(item.dateCreated).toLocaleDateString()}
                    </Text>
                  )}
                </YStack>
              </XStack>
            )}
          />

          {/* Import button */}
          <LinearGradient
            colors={selectedCount > 0 ? ['#ffb77d', '#6e3900'] : ['#2e3c4f', '#1a2a3f']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.importButton}
          >
            <Button
              unstyled
              onPress={handleImport}
              disabled={loading || selectedCount === 0}
              pressStyle={{ opacity: 0.8, scale: 0.98 }}
              width="100%"
              paddingVertical="$4"
              alignItems="center"
            >
              <Text
                fontFamily="$body"
                fontWeight="700"
                fontSize="$4"
                color={selectedCount > 0 ? '#643400' : '$gray8'}
              >
                {loading ? 'Importing...' : `Import ${selectedCount} Dream${selectedCount !== 1 ? 's' : ''}`}
              </Text>
            </Button>
          </LinearGradient>
        </YStack>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContent: {
    paddingBottom: 8,
  },
  importButton: {
    borderRadius: 9999,
    overflow: 'hidden',
  },
  progressTrack: {
    height: 4,
    backgroundColor: 'rgba(33,72,125,0.15)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#ffb77d',
    borderRadius: 2,
  },
});
