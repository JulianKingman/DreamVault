import React, { useRef, useState } from 'react';
import {
  SafeAreaView,
  FlatList,
  Dimensions,
  ViewToken,
  Alert,
} from 'react-native';
import {
  Text,
  YStack,
  XStack,
  Button,
} from 'tamagui';
import {
  FileText,
  Apple,
  Cloud,
  PenTool,
  Lightbulb,
} from '@tamagui/lucide-icons';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { useRouter } from 'expo-router';
import { parseImportFile, type FileParseResult, type ParseOptions } from '../utils/import-parser';
import { findImportByHash, type ImportRecord } from '../utils/database';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH - 60;

// ── Instruction Cards Data ─────────────────────────────────────────────

interface InstructionCard {
  id: string;
  appName: string;
  icon: React.ReactNode;
  steps: string[];
}

const INSTRUCTION_CARDS: InstructionCard[] = [
  {
    id: 'apple-notes',
    appName: 'Apple Notes',
    icon: <Apple size={24} />,
    steps: [
      'Open the Notes app',
      'Tap "..." menu > Select Notes',
      'Select the notes you want to export',
      'Tap Share > Export as Markdown',
      'Save to Files app',
    ],
  },
  {
    id: 'google-keep',
    appName: 'Google Keep',
    icon: <Lightbulb size={24} />,
    steps: [
      'Go to takeout.google.com',
      'Select only Google Keep',
      'Download your export',
      'Extract the zip file',
      'Find your notes as .md or .txt files',
    ],
  },
  {
    id: 'bear',
    appName: 'Bear',
    icon: <PenTool size={24} />,
    steps: [
      'Open Bear on your device',
      'Select the notes to export',
      'File > Export Notes',
      'Choose Markdown format',
      'Save to Files app',
    ],
  },
  {
    id: 'notion',
    appName: 'Notion',
    icon: <Cloud size={24} />,
    steps: [
      'Open your Notion workspace',
      'Settings > Export content',
      'Choose Markdown & CSV',
      'Download and extract the zip',
      'Find your pages as .md files',
    ],
  },
  {
    id: 'plain-text',
    appName: 'Text Files',
    icon: <FileText size={24} />,
    steps: [
      'Any .txt or .md file works',
      'One file per dream, or',
      'Multiple dreams separated by dates',
      'Dates at the top become entry dates',
    ],
  },
];

// ── Main Component ─────────────────────────────────────────────────────

export default function ImportScreen() {
  const router = useRouter();
  const [activeIndex, setActiveIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems.length > 0 && viewableItems[0].index != null) {
        setActiveIndex(viewableItems[0].index);
      }
    }
  ).current;

  const viewabilityConfig = useRef({ viewAreaCoveragePercentThreshold: 50 }).current;

  const handleSelectFiles = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['text/plain', 'text/markdown', 'text/*'],
        multiple: true,
        copyToCacheDirectory: true,
      });

      if (result.canceled || !result.assets?.length) return;

      setIsLoading(true);

      const defaultOptions: ParseOptions = {
        useDatesFromContent: true,
        splitByDateHeaders: true,
      };

      const parseResults: FileParseResult[] = [];
      const duplicates: { result: FileParseResult; existing: ImportRecord }[] = [];

      for (const asset of result.assets) {
        // Get file info for modification time
        const info = await FileSystem.getInfoAsync(asset.uri);
        const modTime = info.exists && 'modificationTime' in info
          ? new Date((info.modificationTime as number) * 1000).toISOString()
          : null;

        const parsed = await parseImportFile(
          asset.uri,
          asset.name,
          modTime,
          defaultOptions
        );

        // Check for previous imports
        const existing = findImportByHash(parsed.contentHash);
        if (existing) {
          duplicates.push({ result: parsed, existing });
        } else {
          parseResults.push(parsed);
        }
      }

      // Handle duplicates with alerts
      for (const dup of duplicates) {
        const action = await showDuplicateAlert(dup.result.filename, dup.existing);
        if (action === 'import') {
          parseResults.push(dup.result);
        } else if (action === 'replace') {
          parseResults.push({ ...dup.result, _replaceImportId: dup.existing.id, _replaceDreamIds: dup.existing.dream_ids } as any);
        }
        // 'skip' — do nothing
      }

      if (parseResults.length === 0) {
        Alert.alert('No entries', 'No new entries to import.');
        setIsLoading(false);
        return;
      }

      // Navigate to review screen with parsed data
      router.push({
        pathname: '/import-review' as any,
        params: {
          data: JSON.stringify(parseResults),
        },
      });
    } catch (e: any) {
      Alert.alert('Import Error', e.message ?? 'Failed to read selected files.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <YStack flex={1}>
        {/* Scrollable content */}
        <YStack flex={1} padding="$4" space="$4">
          <YStack space="$2">
            <Text fontSize="$8" fontWeight="bold">Import Dreams</Text>
            <Text fontSize="$4" color="$gray10">
              Export your notes as text or Markdown files, then pick them here.
            </Text>
          </YStack>

          {/* Instructions Carousel */}
          <YStack space="$2">
            <Text fontSize="$5" fontWeight="600" color="$gray11">
              How to export from...
            </Text>

            <FlatList
              data={INSTRUCTION_CARDS}
              horizontal
              showsHorizontalScrollIndicator={false}
              snapToInterval={CARD_WIDTH + 12}
              decelerationRate="fast"
              contentContainerStyle={{ paddingRight: 20 }}
              onViewableItemsChanged={onViewableItemsChanged}
              viewabilityConfig={viewabilityConfig}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <InstructionCardView card={item} />
              )}
            />

            {/* Page Indicator */}
            <XStack justifyContent="center" space="$1.5" paddingTop="$2">
              {INSTRUCTION_CARDS.map((card, i) => (
                <YStack
                  key={card.id}
                  width={8}
                  height={8}
                  borderRadius={4}
                  backgroundColor={i === activeIndex ? '$blue10' : '$gray6'}
                />
              ))}
            </XStack>
          </YStack>
        </YStack>

        {/* Fixed bottom button */}
        <YStack padding="$4" paddingTop="$2" borderTopWidth={1} borderTopColor="$gray4">
          <Button
            size="$5"
            backgroundColor="$blue10"
            color="white"
            fontWeight="bold"
            borderRadius="$4"
            onPress={handleSelectFiles}
            disabled={isLoading}
            opacity={isLoading ? 0.6 : 1}
            icon={isLoading ? undefined : <FileText size={20} color="white" />}
          >
            {isLoading ? 'Reading files...' : 'Select Files'}
          </Button>
        </YStack>
      </YStack>
    </SafeAreaView>
  );
}

// ── Instruction Card Component ─────────────────────────────────────────

function InstructionCardView({ card }: { card: InstructionCard }) {
  return (
    <YStack
      width={CARD_WIDTH}
      marginRight={12}
      backgroundColor="$background"
      borderRadius="$4"
      padding="$4"
      borderWidth={1}
      borderColor="$gray4"
      space="$3"
    >
      <XStack alignItems="center" space="$2">
        {card.icon}
        <Text fontSize="$5" fontWeight="bold">{card.appName}</Text>
      </XStack>

      <YStack space="$2">
        {card.steps.map((step, i) => (
          <XStack key={i} alignItems="flex-start" space="$2">
            <Text fontSize="$3" color="$gray10" width={20} textAlign="right">
              {i + 1}.
            </Text>
            <Text fontSize="$3" color="$gray11" flex={1}>{step}</Text>
          </XStack>
        ))}
      </YStack>
    </YStack>
  );
}

// ── Duplicate Alert ────────────────────────────────────────────────────

function showDuplicateAlert(
  filename: string,
  existing: ImportRecord
): Promise<'skip' | 'import' | 'replace'> {
  const importDate = new Date(existing.imported_at).toLocaleDateString();
  return new Promise((resolve) => {
    Alert.alert(
      'Already Imported',
      `"${filename}" was previously imported on ${importDate} (${existing.entry_count} entries).`,
      [
        { text: 'Skip', style: 'cancel', onPress: () => resolve('skip') },
        { text: 'Import Anyway', onPress: () => resolve('import') },
        {
          text: 'Replace Previous',
          style: 'destructive',
          onPress: () => resolve('replace'),
        },
      ]
    );
  });
}
