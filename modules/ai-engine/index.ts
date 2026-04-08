import { requireNativeModule } from 'expo-modules-core';

interface AiEngineInterface {
  isAvailable(): Promise<boolean>;
  summarizeDream(content: string): Promise<string>;
  suggestTags(content: string): Promise<string[]>;
  analyzePatterns(entries: string[]): Promise<string>;
}

let AiEngine: AiEngineInterface;

try {
  AiEngine = requireNativeModule('AiEngine');
} catch {
  // Module not available (e.g., Expo Go, unsupported platform)
  AiEngine = {
    isAvailable: async () => false,
    summarizeDream: async () => { throw new Error('AI not available'); },
    suggestTags: async () => { throw new Error('AI not available'); },
    analyzePatterns: async () => { throw new Error('AI not available'); },
  };
}

export default AiEngine;
