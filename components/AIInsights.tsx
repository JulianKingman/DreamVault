import React, { useState } from 'react';
import { YStack, XStack, Text, Button, Spinner } from 'tamagui';
import { ChevronDown, ChevronUp, Sparkles } from '@tamagui/lucide-icons';
import { useAI } from '../hooks/useAI';

interface AIInsightsProps {
  content: string;
  onSuggestTags?: (tags: string[]) => void;
}

export function AIInsights({ content, onSuggestTags }: AIInsightsProps) {
  const { available, summarize, suggestTags } = useAI();
  const [expanded, setExpanded] = useState(false);
  const [summary, setSummary] = useState<string | null>(null);
  const [tags, setTags] = useState<string[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!available) return null;

  const handleExpand = async () => {
    if (!expanded && !summary) {
      setLoading(true);
      setError(null);
      try {
        const [summaryResult, tagResults] = await Promise.all([
          summarize(content),
          suggestTags(content),
        ]);
        setSummary(summaryResult);
        setTags(tagResults);
      } catch (e: any) {
        setError(e.message ?? 'AI analysis failed');
      } finally {
        setLoading(false);
      }
    }
    setExpanded(!expanded);
  };

  return (
    <YStack
      backgroundColor="$backgroundStrong"
      borderRadius="$4"
      padding="$3"
      space="$2"
    >
      <XStack
        alignItems="center"
        space="$2"
        onPress={handleExpand}
        pressStyle={{ opacity: 0.7 }}
      >
        <Sparkles size={18} color="$purple10" />
        <Text flex={1} fontWeight="bold" fontSize="$4">
          AI Insights
        </Text>
        {expanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
      </XStack>

      {expanded && (
        <YStack space="$3" paddingTop="$2">
          {loading && (
            <XStack justifyContent="center" padding="$4">
              <Spinner size="small" />
              <Text marginLeft="$2" color="$gray10">Analyzing dream...</Text>
            </XStack>
          )}

          {error && (
            <Text color="$red10" fontSize="$3">{error}</Text>
          )}

          {summary && (
            <YStack space="$1">
              <Text fontSize="$3" fontWeight="bold" color="$gray10">
                Summary
              </Text>
              <Text fontSize="$3">{summary}</Text>
            </YStack>
          )}

          {tags && tags.length > 0 && (
            <YStack space="$1">
              <Text fontSize="$3" fontWeight="bold" color="$gray10">
                Suggested Tags
              </Text>
              <XStack flexWrap="wrap" gap="$2">
                {tags.map(tag => (
                  <XStack
                    key={tag}
                    backgroundColor="$purple4"
                    borderRadius="$4"
                    paddingHorizontal="$3"
                    paddingVertical="$1"
                    pressStyle={{ opacity: 0.7 }}
                    onPress={() => onSuggestTags?.([tag])}
                  >
                    <Text fontSize="$3">{tag}</Text>
                  </XStack>
                ))}
              </XStack>
            </YStack>
          )}
        </YStack>
      )}
    </YStack>
  );
}
