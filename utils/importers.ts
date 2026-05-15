import * as FileSystem from 'expo-file-system/legacy';

export interface ImportedDream {
  title: string;
  content: string;
  dateCreated: string | null;
  selected: boolean;
}

const DATE_PATTERNS = [
  // ISO date
  /(\d{4}-\d{2}-\d{2})/,
  // MM/DD/YYYY
  /(\d{1,2}\/\d{1,2}\/\d{4})/,
  // Month Day, Year
  /((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\w*\s+\d{1,2},?\s+\d{4})/i,
];

function detectDate(text: string): string | null {
  for (const pattern of DATE_PATTERNS) {
    const match = text.match(pattern);
    if (match) {
      const parsed = new Date(match[1]);
      if (!isNaN(parsed.getTime())) {
        return parsed.toISOString();
      }
    }
  }
  return null;
}

export async function parseTextFile(uri: string, fileName: string): Promise<ImportedDream> {
  const content = await FileSystem.readAsStringAsync(uri);
  const lines = content.split('\n').filter(l => l.trim());

  const title = lines[0]?.trim() ?? fileName.replace(/\.\w+$/, '');
  const body = lines.slice(1).join('\n').trim();
  const dateCreated = detectDate(content);

  return {
    title,
    content: body || lines[0] || '',
    dateCreated,
    selected: true,
  };
}

export async function parseMultipleFiles(
  files: { uri: string; name: string }[]
): Promise<ImportedDream[]> {
  const results: ImportedDream[] = [];
  for (const file of files) {
    const parsed = await parseTextFile(file.uri, file.name);
    results.push(parsed);
  }
  return results;
}
