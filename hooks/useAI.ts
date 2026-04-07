/**
 * Stub — AI features not yet implemented on this branch.
 */
export function useAI() {
  return {
    available: false,
    suggestTags: async (_content: string): Promise<string[]> => [],
  };
}
