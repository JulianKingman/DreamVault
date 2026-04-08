import * as FileSystem from 'expo-file-system';
import * as Crypto from 'expo-crypto';

// ── Types ──────────────────────────────────────────────────────────────

export interface ParsedEntry {
  title: string | null;
  content: string;
  dateCreated: string; // ISO string
  sourceFile: string;
}

export interface ParseOptions {
  useDatesFromContent: boolean;
  splitByDateHeaders: boolean;
}

export interface FileParseResult {
  entries: ParsedEntry[];
  contentHash: string;
  filename: string;
}

// ── Date Detection ─────────────────────────────────────────────────────

const MONTH_NAMES = [
  'january', 'february', 'march', 'april', 'may', 'june',
  'july', 'august', 'september', 'october', 'november', 'december',
];
const MONTH_ABBREVS = [
  'jan', 'feb', 'mar', 'apr', 'may', 'jun',
  'jul', 'aug', 'sep', 'oct', 'nov', 'dec',
];
const DAY_NAMES = [
  'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday',
];

// Patterns that match a full line that is ONLY a date
const DATE_PATTERNS: { regex: RegExp; parse: (m: RegExpMatchArray) => Date | null }[] = [
  // ISO: 2024-01-15
  {
    regex: /^(\d{4})-(\d{1,2})-(\d{1,2})$/,
    parse: (m) => safeDate(+m[1], +m[2] - 1, +m[3]),
  },
  // US slash: 01/15/2024
  {
    regex: /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/,
    parse: (m) => safeDate(+m[3], +m[1] - 1, +m[2]),
  },
  // Month DD, YYYY  or  Month DD YYYY
  {
    regex: new RegExp(
      `^(${MONTH_NAMES.join('|')})\\s+(\\d{1,2}),?\\s+(\\d{4})$`,
      'i'
    ),
    parse: (m) => safeDate(+m[3], monthIndex(m[1]), +m[2]),
  },
  // DD Month YYYY
  {
    regex: new RegExp(
      `^(\\d{1,2})\\s+(${MONTH_NAMES.join('|')})\\s+(\\d{4})$`,
      'i'
    ),
    parse: (m) => safeDate(+m[3], monthIndex(m[2]), +m[1]),
  },
  // Mon DD, YYYY  or  Mon DD YYYY (abbreviated)
  {
    regex: new RegExp(
      `^(${MONTH_ABBREVS.join('|')})\\.?\\s+(\\d{1,2}),?\\s+(\\d{4})$`,
      'i'
    ),
    parse: (m) => safeDate(+m[3], monthIndex(m[1]), +m[2]),
  },
  // Day, Month DD, YYYY  (e.g. "Monday, January 15, 2024")
  {
    regex: new RegExp(
      `^(?:${DAY_NAMES.join('|')}),?\\s+(${MONTH_NAMES.join('|')})\\s+(\\d{1,2}),?\\s+(\\d{4})$`,
      'i'
    ),
    parse: (m) => safeDate(+m[3], monthIndex(m[1]), +m[2]),
  },
  // Day, Mon DD, YYYY  (e.g. "Mon, Jan 15, 2024")
  {
    regex: new RegExp(
      `^(?:${DAY_NAMES.join('|')}|mon|tue|wed|thu|fri|sat|sun),?\\s+(${MONTH_ABBREVS.join('|')})\\.?\\s+(\\d{1,2}),?\\s+(\\d{4})$`,
      'i'
    ),
    parse: (m) => safeDate(+m[3], monthIndex(m[1]), +m[2]),
  },
];

function monthIndex(name: string): number {
  const lower = name.toLowerCase().slice(0, 3);
  const idx = MONTH_ABBREVS.indexOf(lower);
  return idx >= 0 ? idx : 0;
}

function safeDate(year: number, month: number, day: number): Date | null {
  if (year < 1970 || year > 2100) return null;
  if (month < 0 || month > 11) return null;
  if (day < 1 || day > 31) return null;
  const d = new Date(year, month, day);
  if (d.getFullYear() !== year || d.getMonth() !== month || d.getDate() !== day) {
    return null; // invalid date (e.g. Feb 30)
  }
  return d;
}

/** Try to parse a trimmed line as a date. Returns the Date or null. */
export function parseDateLine(line: string): Date | null {
  const trimmed = line.trim();
  if (!trimmed) return null;

  // Strip leading markdown heading markers
  const cleaned = trimmed.replace(/^#+\s*/, '');

  for (const pattern of DATE_PATTERNS) {
    const match = cleaned.match(pattern.regex);
    if (match) {
      return pattern.parse(match);
    }
  }
  return null;
}

// ── Markdown Stripping ─────────────────────────────────────────────────

/** Strip Markdown syntax to produce clean plain text. */
export function stripMarkdown(text: string): string {
  let result = text;

  // Remove heading markers: "## Title" → "Title"
  result = result.replace(/^#{1,6}\s+/gm, '');

  // Remove bold/italic markers: **text** → text, *text* → text, __text__ → text, _text_ → text
  result = result.replace(/\*\*(.+?)\*\*/g, '$1');
  result = result.replace(/\*(.+?)\*/g, '$1');
  result = result.replace(/__(.+?)__/g, '$1');
  result = result.replace(/_(.+?)_/g, '$1');

  // Remove strikethrough: ~~text~~ → text
  result = result.replace(/~~(.+?)~~/g, '$1');

  // Remove inline code: `code` → code
  result = result.replace(/`([^`]+)`/g, '$1');

  // Remove links: [text](url) → text
  result = result.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');

  // Remove images: ![alt](url) → alt
  result = result.replace(/!\[([^\]]*)\]\([^)]+\)/g, '$1');

  // Remove blockquote markers: "> text" → "text"
  result = result.replace(/^>\s?/gm, '');

  // Remove task list markers: "- [ ] text" → "text", "- [x] text" → "text"
  result = result.replace(/^[-*]\s*\[[ x]\]\s*/gm, '');

  // Remove unordered list markers: "- text" or "* text" → "text"
  result = result.replace(/^[-*]\s+/gm, '');

  // Remove ordered list markers: "1. text" → "text"
  result = result.replace(/^\d+\.\s+/gm, '');

  // Remove horizontal rules
  result = result.replace(/^[-*_]{3,}\s*$/gm, '');

  // Collapse multiple blank lines into at most two
  result = result.replace(/\n{3,}/g, '\n\n');

  return result.trim();
}

// ── File Parsing ───────────────────────────────────────────────────────

/**
 * Hash file content for duplicate detection.
 */
async function hashContent(content: string): Promise<string> {
  return await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    content
  );
}

/**
 * Extract a title from the first meaningful line of content.
 * Returns [title, remainingContent].
 */
function extractTitle(content: string, fallbackFilename: string): [string | null, string] {
  const lines = content.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // Check if it looks like a heading (starts with # or is short and could be a title)
    const isHeading = /^#{1,6}\s+/.test(lines[i]);
    const isShortLine = line.length <= 80;

    if (isHeading || isShortLine) {
      const title = line.replace(/^#{1,6}\s+/, '').trim();
      const remaining = [...lines.slice(0, i), ...lines.slice(i + 1)].join('\n').trim();
      return [title, remaining];
    }

    // First line is long paragraph text — derive title from filename
    break;
  }

  // Derive from filename
  const name = fallbackFilename.replace(/\.(md|txt|text|markdown)$/i, '').trim();
  return [name || null, content];
}

/**
 * Split a file's content into entries by date headers.
 */
function splitByDates(text: string): { date: Date | null; content: string }[] {
  const lines = text.split('\n');
  const sections: { date: Date | null; content: string; startLine: number }[] = [];
  let currentDate: Date | null = null;
  let currentLines: string[] = [];
  let currentStart = 0;

  for (let i = 0; i < lines.length; i++) {
    const parsed = parseDateLine(lines[i]);
    if (parsed) {
      // Save previous section if it has content
      if (currentLines.length > 0) {
        const content = currentLines.join('\n').trim();
        if (content) {
          sections.push({ date: currentDate, content, startLine: currentStart });
        }
      }
      currentDate = parsed;
      currentLines = [];
      currentStart = i + 1;
    } else {
      currentLines.push(lines[i]);
    }
  }

  // Don't forget the last section
  if (currentLines.length > 0) {
    const content = currentLines.join('\n').trim();
    if (content) {
      sections.push({ date: currentDate, content, startLine: currentStart });
    }
  }

  return sections;
}

/**
 * Parse a single imported file into entries.
 */
export async function parseImportFile(
  uri: string,
  filename: string,
  fileModTime: string | null,
  options: ParseOptions
): Promise<FileParseResult> {
  const raw = await FileSystem.readAsStringAsync(uri);
  const contentHash = await hashContent(raw);

  if (!raw.trim()) {
    return { entries: [], contentHash, filename };
  }

  const fallbackDate = fileModTime ?? new Date().toISOString();
  const entries: ParsedEntry[] = [];

  if (options.splitByDateHeaders) {
    const sections = splitByDates(raw);

    if (sections.length > 1 || (sections.length === 1 && sections[0].date)) {
      // Multiple date-separated sections
      for (const section of sections) {
        if (!section.content.trim()) continue;

        const dateCreated = options.useDatesFromContent && section.date
          ? section.date.toISOString()
          : fallbackDate;

        const stripped = stripMarkdown(section.content);
        const [title, content] = extractTitle(stripped, filename);

        if (content.trim()) {
          entries.push({
            title,
            content: content.trim(),
            dateCreated,
            sourceFile: filename,
          });
        }
      }

      if (entries.length > 0) {
        return { entries, contentHash, filename };
      }
      // Fall through to single-entry if splitting produced nothing
    }
  }

  // Single entry from entire file
  let text = raw;

  // Check for date on the first non-blank line
  const lines = text.split('\n');
  let dateCreated = fallbackDate;

  for (let i = 0; i < lines.length; i++) {
    if (!lines[i].trim()) continue;
    const parsed = parseDateLine(lines[i]);
    if (parsed && options.useDatesFromContent) {
      dateCreated = parsed.toISOString();
      lines.splice(i, 1); // remove the date line
      text = lines.join('\n');
    }
    break; // only check the first non-blank line
  }

  const stripped = stripMarkdown(text);
  const [title, content] = extractTitle(stripped, filename);

  if (content.trim()) {
    entries.push({
      title,
      content: content.trim(),
      dateCreated,
      sourceFile: filename,
    });
  }

  return { entries, contentHash, filename };
}
