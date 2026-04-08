import React, { useState, useMemo, useCallback } from 'react';
import {
  SafeAreaView,
  Alert,
  Pressable,
} from 'react-native';
import {
  Text,
  YStack,
  XStack,
  Button,
  Switch,
  Separator,
} from 'tamagui';
import {
  Calendar,
  SplitSquareVertical,
  ChevronDown,
  ChevronUp,
  Trash2,
  Check,
} from '@tamagui/lucide-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { LegendList } from '@legendapp/list/react-native';
import type { ParsedEntry, FileParseResult } from '../utils/import-parser';
import {
  addDreamBulk,
  recordImport,
  deleteImportedDreams,
  deleteImportRecord,
} from '../utils/database';

// ── Types ──────────────────────────────────────────────────────────────

interface ReviewEntry extends ParsedEntry {
  excluded: boolean;
  fileIndex: number;
}

interface FileParseResultWithReplace extends FileParseResult {
  _replaceImportId?: number;
  _replaceDreamIds?: number[];
}

// ── Main Component ─────────────────────────────────────────────────────

export default function ImportReviewScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ data: string }>();
  const [isImporting, setIsImporting] = useState(false);
  const [optionsExpanded, setOptionsExpanded] = useState(true);
  const [expandedEntry, setExpandedEntry] = useState<number | null>(null);

  // Parse data from navigation params
  const fileResults: FileParseResultWithReplace[] = useMemo(() => {
    try {
      return JSON.parse(params.data);
    } catch {
      return [];
    }
  }, [params.data]);

  // Build flat entry list
  const [entries, setEntries] = useState<ReviewEntry[]>(() => {
    const all: ReviewEntry[] = [];
    fileResults.forEach((file, fileIndex) => {
      file.entries.forEach((entry) => {
        all.push({ ...entry, excluded: false, fileIndex });
      });
    });
    return all;
  });

  const includedEntries = useMemo(
    () => entries.filter((e) => !e.excluded),
    [entries]
  );

  const totalFiles = fileResults.length;

  const toggleExclude = useCallback((index: number) => {
    setEntries((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], excluded: !next[index].excluded };
      return next;
    });
  }, []);

  const toggleExpand = useCallback((index: number) => {
    setExpandedEntry((prev) => (prev === index ? null : index));
  }, []);

  // ── Import ─────────────────────────────────────────────────────────

  const handleImport = async () => {
    if (includedEntries.length === 0) {
      Alert.alert('No entries', 'All entries have been excluded.');
      return;
    }

    setIsImporting(true);
    try {
      // Handle replacements first
      for (const file of fileResults) {
        if (file._replaceImportId != null && file._replaceDreamIds) {
          deleteImportedDreams(file._replaceDreamIds);
          deleteImportRecord(file._replaceImportId);
        }
      }

      // Group entries by source file for import history
      const entriesByFile = new Map<number, ReviewEntry[]>();
      for (const entry of includedEntries) {
        const existing = entriesByFile.get(entry.fileIndex) ?? [];
        existing.push(entry);
        entriesByFile.set(entry.fileIndex, existing);
      }

      let totalImported = 0;

      for (const [fileIndex, fileEntries] of entriesByFile) {
        const file = fileResults[fileIndex];
        const dreams = fileEntries.map((e) => ({
          content: e.content,
          title: e.title ?? undefined,
          dateCreated: e.dateCreated,
        }));

        const ids = addDreamBulk(dreams);
        recordImport(file.contentHash, file.filename, ids);
        totalImported += ids.length;
      }

      Alert.alert(
        'Import Complete',
        `Successfully imported ${totalImported} dream${totalImported === 1 ? '' : 's'}.`,
        [
          {
            text: 'OK',
            onPress: () => {
              // Go back to the main journal
              router.dismissAll();
            },
          },
        ]
      );
    } catch (e: any) {
      Alert.alert('Import Failed', e.message ?? 'An error occurred during import.');
    } finally {
      setIsImporting(false);
    }
  };

  // ── Render ─────────────────────────────────────────────────────────

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <YStack flex={1}>
        {/* Header */}
        <YStack padding="$4" paddingBottom="$2" space="$1">
          <Text fontSize="$7" fontWeight="bold">Review Import</Text>
          <Text fontSize="$4" color="$gray10">
            {includedEntries.length} entr{includedEntries.length === 1 ? 'y' : 'ies'} from {totalFiles} file{totalFiles === 1 ? '' : 's'}
          </Text>
        </YStack>

        {/* Options */}
        <Pressable onPress={() => setOptionsExpanded(!optionsExpanded)}>
          <XStack
            paddingHorizontal="$4"
            paddingVertical="$2"
            alignItems="center"
            justifyContent="space-between"
          >
            <Text fontSize="$4" fontWeight="600" color="$gray11">Options</Text>
            {optionsExpanded
              ? <ChevronUp size={18} color="$gray10" />
              : <ChevronDown size={18} color="$gray10" />
            }
          </XStack>
        </Pressable>

        {optionsExpanded && (
          <YStack
            paddingHorizontal="$4"
            paddingBottom="$3"
            space="$3"
          >
            <Text fontSize="$2" color="$gray10">
              These options were applied during parsing. Changing them will re-process the files in a future update.
            </Text>

            <XStack alignItems="center" justifyContent="space-between">
              <XStack alignItems="center" space="$2" flex={1}>
                <Calendar size={18} />
                <Text fontSize="$3">Use dates found in content</Text>
              </XStack>
              <Switch size="$3" checked={true} disabled native />
            </XStack>

            <XStack alignItems="center" justifyContent="space-between">
              <XStack alignItems="center" space="$2" flex={1}>
                <SplitSquareVertical size={18} />
                <Text fontSize="$3">Split files by date headers</Text>
              </XStack>
              <Switch size="$3" checked={true} disabled native />
            </XStack>
          </YStack>
        )}

        <Separator />

        {/* Entry List */}
        <YStack flex={1} paddingHorizontal="$4" paddingTop="$2">
          <LegendList
            data={entries}
            estimatedItemSize={100}
            keyExtractor={(_, index) => String(index)}
            renderItem={({ item, index }) => (
              <EntryCard
                entry={item}
                index={index}
                isExpanded={expandedEntry === index}
                onToggleExclude={() => toggleExclude(index)}
                onToggleExpand={() => toggleExpand(index)}
              />
            )}
            ItemSeparatorComponent={() => <YStack height={8} />}
            contentContainerStyle={{ paddingBottom: 16 }}
          />
        </YStack>

        {/* Footer */}
        <YStack
          padding="$4"
          paddingTop="$2"
          borderTopWidth={1}
          borderTopColor="$gray4"
          space="$2"
        >
          <Button
            size="$5"
            backgroundColor="$blue10"
            color="white"
            fontWeight="bold"
            borderRadius="$4"
            onPress={handleImport}
            disabled={isImporting || includedEntries.length === 0}
            opacity={isImporting || includedEntries.length === 0 ? 0.6 : 1}
            icon={<Check size={20} color="white" />}
          >
            {isImporting
              ? 'Importing...'
              : `Import ${includedEntries.length} entr${includedEntries.length === 1 ? 'y' : 'ies'}`
            }
          </Button>

          <Button
            size="$4"
            variant="outlined"
            borderRadius="$4"
            onPress={() => router.back()}
            disabled={isImporting}
          >
            Cancel
          </Button>
        </YStack>
      </YStack>
    </SafeAreaView>
  );
}

// ── Entry Card ─────────────────────────────────────────────────────────

function EntryCard({
  entry,
  index,
  isExpanded,
  onToggleExclude,
  onToggleExpand,
}: {
  entry: ReviewEntry;
  index: number;
  isExpanded: boolean;
  onToggleExclude: () => void;
  onToggleExpand: () => void;
}) {
  const dateStr = new Date(entry.dateCreated).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  const preview = entry.content.length > 120
    ? entry.content.slice(0, 120) + '...'
    : entry.content;

  return (
    <YStack
      backgroundColor="$background"
      borderRadius="$3"
      borderWidth={1}
      borderColor={entry.excluded ? '$gray4' : '$gray6'}
      opacity={entry.excluded ? 0.5 : 1}
      overflow="hidden"
    >
      <Pressable onPress={onToggleExpand}>
        <YStack padding="$3" space="$1.5">
          <XStack justifyContent="space-between" alignItems="center">
            <Text
              fontSize="$4"
              fontWeight="bold"
              flex={1}
              numberOfLines={1}
            >
              {entry.title ?? `Entry ${index + 1}`}
            </Text>
            <Text fontSize="$2" color="$gray10">{dateStr}</Text>
          </XStack>

          <Text fontSize="$3" color="$gray10" numberOfLines={isExpanded ? undefined : 2}>
            {isExpanded ? entry.content : preview}
          </Text>

          <XStack justifyContent="space-between" alignItems="center" paddingTop="$1">
            <Text fontSize="$1" color="$gray8">{entry.sourceFile}</Text>
            <Pressable
              onPress={(e) => {
                e.stopPropagation?.();
                onToggleExclude();
              }}
              hitSlop={8}
            >
              <XStack alignItems="center" space="$1">
                <Trash2 size={14} color={entry.excluded ? '$blue10' : '$red10'} />
                <Text fontSize="$2" color={entry.excluded ? '$blue10' : '$red10'}>
                  {entry.excluded ? 'Include' : 'Exclude'}
                </Text>
              </XStack>
            </Pressable>
          </XStack>
        </YStack>
      </Pressable>
    </YStack>
  );
}
