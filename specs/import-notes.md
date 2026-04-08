# Import Notes — Spec

## Problem

Users have existing dream journals in note-taking apps (Apple Notes, Google Keep, Notion, Bear, etc.). There is no iOS API to read from these apps directly — every competing journal app (Day One, Bear, Obsidian) relies on the same pattern: user exports to files, then imports those files. We need a clean, guided import flow that handles the most common export formats.

## Goal

Let users import dream entries from `.md` and `.txt` files, with smart date detection and a preview step before committing.

## User Flow

### 1. Settings > Import

Tap "Import" in the Data section of Settings. Navigates to a new **Import screen** (`app/import.tsx`, presented as a modal).

### 2. Instructions Carousel

The Import screen opens with a brief instruction card explaining how to export from popular note apps. Each card shows:

- **Apple Notes (iOS 26+):** Select notes > Share > Export as Markdown > Save to Files
- **Apple Notes (older iOS):** Use the "Export Notes" Shortcut (link to pre-built Shortcut we publish) > saves .txt files to Files
- **Google Keep:** Google Takeout > download Keep folder > .md/.txt files
- **Bear:** File > Export Notes > Markdown
- **Notion:** Export > Markdown & CSV
- **Plain text:** Any `.txt` or `.md` files

Swipeable horizontal cards, 1 per app. Below the cards: a prominent **"Select Files"** button.

### 3. File Picker

Tapping "Select Files" opens `expo-document-picker` configured for:
- Multiple selection enabled
- UTIs / MIME types: `text/plain`, `text/markdown`, `text/*`
- No restriction on source (iCloud Drive, On My iPhone, Dropbox, etc.)

### 4. Parsing

Each selected file is read via `expo-file-system` and parsed:

```
parseImportFile(uri, filename) -> ParsedEntry[]
```

**Per file, the parser:**

1. Reads the full text content.
2. Checks if the file contains multiple entries separated by date headers. A "date header" is a line matching common date patterns (see below) preceded by a blank line (or at start of file).
3. If multiple date headers found → split into multiple entries at each date header.
4. If no date headers (or only one at the very top) → treat entire file as a single entry.
5. For each entry:
   - If the first line is a detected date → use it as `dateCreated`, remove from content.
   - Otherwise, use the file's modification timestamp as `dateCreated`.
   - First non-date, non-blank line becomes the `title` (if it looks like a heading: starts with `#`, is short, or is bold `**...**`). Otherwise title is derived from filename.
   - Remaining text is `content`, with Markdown syntax stripped to plain text (remove `#` heading markers, `**`/`*` emphasis markers, `- [ ]` task markers, `> ` blockquote markers, `[text](url)` → `text`, inline code backticks). Preserve line breaks and paragraph structure. The app currently stores plain text; if the editor later adopts Markdown as its native storage format, this stripping step can simply be removed and `.md` content passed through as-is.

**Date patterns detected** (first line only for single-entry; any line for multi-entry split):
- `YYYY-MM-DD` (ISO)
- `MM/DD/YYYY`, `DD/MM/YYYY` (slash-separated — use locale hint, default to MM/DD)
- `Month DD, YYYY` (e.g. "January 15, 2024")
- `DD Month YYYY` (e.g. "15 January 2024")
- `Mon DD, YYYY` (e.g. "Jan 15, 2024")
- Lines that are *only* a date (possibly with day name prefix like "Monday, January 15, 2024")

### 5. Preview / Review Screen

After parsing, navigate to **Import Review** (`app/import-review.tsx`):

**Header:** "{N} entries found from {M} files"

**Options section** (collapsible, open by default on first import):
- **"Use dates found in content"** — toggle (default ON). When ON, detected dates become entry dates and are stripped from content. When OFF, file modification date is used for all.
- **"Split files by date headers"** — toggle (default ON). When ON, files with multiple date-separated sections become multiple entries. When OFF, each file = one entry.

**Preview list:**
- Shows all parsed entries as cards
- Each card: title (or first ~50 chars), detected date, first ~100 chars of content preview
- Tappable to expand and see full content
- Swipe to dismiss / exclude individual entries

**Footer:** "Import {N} entries" button (primary action), "Cancel" (secondary)

### 6. Import Execution

On confirm:
1. Show a brief loading indicator
2. Call `addDreamBulk()` with all confirmed entries
3. On success: navigate back to the journal tab with a toast "Imported {N} dreams"
4. On failure: show error, entries remain in the review screen for retry

## Data Model

```typescript
interface ParsedEntry {
  title: string | null;
  content: string;
  dateCreated: string; // ISO string
  sourceFile: string;  // original filename, for debugging
}
```

## Duplicate Detection

On import, each file's raw content is SHA-256 hashed before parsing. Hashes and metadata are stored in an `import_history` table:

```sql
CREATE TABLE IF NOT EXISTS import_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  content_hash TEXT NOT NULL,        -- SHA-256 of raw file content
  filename TEXT NOT NULL,
  imported_at TEXT NOT NULL,          -- ISO timestamp
  entry_count INTEGER NOT NULL,      -- how many dream entries were created
  dream_ids TEXT NOT NULL             -- JSON array of dream IDs created from this file
);
CREATE INDEX IF NOT EXISTS idx_import_hash ON import_history(content_hash);
```

**On file selection**, before parsing, each file's hash is checked against `import_history`. If a match is found, the review screen shows a banner per duplicate file:

> "**{filename}** was previously imported on {date} ({N} entries). What would you like to do?"
> - **Skip** — exclude this file from the import
> - **Import anyway** — creates duplicate entries
> - **Replace** — deletes the previous entries (via stored `dream_ids`) and imports fresh

If the file was modified since the last import, the hash won't match — it imports as new content, which is correct.

The `dream_ids` column stores a JSON array so that "Replace" can surgically delete only the entries from that specific prior import.

`addDreamBulk()` is updated to return the array of inserted IDs so they can be recorded in `import_history`.

## File Structure

```
app/
  import.tsx              — Instructions + file picker (modal screen)
  import-review.tsx       — Preview + options + confirm (modal screen)
utils/
  import-parser.ts        — parseImportFile(), date detection, markdown stripping
```

## Dependencies

| Package | Status | Purpose |
|---------|--------|---------|
| `expo-document-picker` | **needs install** | File selection |
| `expo-file-system` | already a transitive dep, may need explicit install | Read file contents |

No native rebuild needed — both are pure Expo packages with config plugins.

## Edge Cases

- **Empty files:** Skip silently, don't create empty entries.
- **Binary / non-text files:** `expo-document-picker` MIME filter should prevent this; if it slips through, catch the read error and skip with a warning.
- **Huge files (>1MB):** Read and parse, but warn if a single entry's content exceeds ~50KB (unusual for a dream entry — might be a misplaced file).
- **Duplicate imports:** Detected via content hash (see Duplicate Detection section). User chooses skip/import anyway/replace per file.
- **Date ambiguity (DD/MM vs MM/DD):** Default to device locale. Show detected date in preview so user can verify.

## Out of Scope (v1)

- Share extension (receiving notes shared directly from other apps)
- Automatic Apple Notes access (no iOS API exists)
- Rich media import (images, drawings, attachments)
- Export functionality
- Apple Shortcut distribution (could add later for pre-iOS 26 users)
- Markdown-native storage (revisit when tentap-editor is wired up — store as `.md` directly, skip stripping)
