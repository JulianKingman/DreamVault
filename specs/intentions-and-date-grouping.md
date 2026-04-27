# Intentions as Separate Entities + Date-Grouped Dream List

## Problem

Currently, `intention` is a column on the `dreams` table. This doesn't match how intentions actually work — you set one intention per night, but may have multiple distinct dreams. When there are multiple dreams per night, intention is duplicated or inconsistent across entries.

The dream list is also flat — each dream is an independent card with no visual connection to sibling dreams from the same night.

## Goal

1. Extract intentions into their own table (one per date)
2. Group dreams visually by date in the list
3. Date+time input, prefilled to now
4. "Save and Add" button for recording multiple dreams per night
5. Prefill intention from the current date's existing intention

## Data Model Changes

### New table: `intentions`

```sql
CREATE TABLE intentions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  date TEXT NOT NULL UNIQUE,     -- YYYY-MM-DD, one per calendar date
  content TEXT NOT NULL,
  dateCreated TEXT NOT NULL,
  dateModified TEXT NOT NULL
);
```

### Migration v7

1. Create `intentions` table
2. Migrate existing non-null `dream.intention` values into `intentions`:
   - Group by date (truncate `dateCreated` to YYYY-MM-DD)
   - Take the first non-empty intention per date
3. Drop `intention` column from `dreams`

### Updated types

Remove `intention` field from `Dream` interface. Add `Intention` type:

```typescript
interface Intention {
  id: number;
  date: string;        // YYYY-MM-DD
  content: string;
  dateCreated: Date;
  dateModified: Date;
}
```

## New Database Functions

- `getOrCreateIntention(date: string, content: string): Intention`
- `getIntentionForDate(date: string): Intention | null`
- `updateIntention(id: number, content: string): void`
- Update `addDream()` — remove `intention` param, add `dateCreated` param

## UI Changes

### New Dream Form

- **Date + Time picker**: `mode="datetime"`, prefilled to `new Date()`
- **Intention field**: On date change (or on mount), check `getIntentionForDate(selectedDate)`. If found, prefill. If not, show empty.
- **Two submit actions**:
  - **Complete**: saves dream + intention, pops back to list
  - **Save and Add**: saves dream + intention, pushes a fresh form with same date + intention prefilled
- Saving: calls `getOrCreateIntention(date, intentionText)` separately from `addDream()`

### Dream List (NoteList)

Group dreams by date. Structure:

```
── Date Header (Saturday, April 19, 2026) ──
   Intention: "Remember my dreams clearly"
   
   [Dream card — 3:20 AM]
   [Dream card — 6:45 AM]

── Date Header (Friday, April 18, 2026) ──
   [Dream card — 7:00 AM]
```

- Date headers are section dividers
- Intention shows under the date header if one exists for that date
- Dream cards show time instead of full date
- Cards within a group have reduced vertical spacing

### View Dream Screen

- Remove inline intention display from dream detail
- Show intention as a read-only section at the top, fetched by dream's date
