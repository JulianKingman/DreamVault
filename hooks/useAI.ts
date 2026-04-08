import { useState, useEffect } from 'react';
import AiEngine from '../modules/ai-engine';

export function useAI() {
  const [available, setAvailable] = useState(false);

  useEffect(() => {
    AiEngine.isAvailable().then(setAvailable).catch(() => setAvailable(false));
  }, []);

  const summarize = async (content: string): Promise<string> => {
    if (!available) throw new Error('AI not available on this device');
    return AiEngine.summarizeDream(content);
  };

  const suggestTags = async (content: string): Promise<string[]> => {
    if (!available) throw new Error('AI not available on this device');
    return AiEngine.suggestTags(content);
  };

  const analyzePatterns = async (entries: string[]): Promise<string> => {
    if (!available) throw new Error('AI not available on this device');
    return AiEngine.analyzePatterns(entries);
  };

  return { available, summarize, suggestTags, analyzePatterns };
}
