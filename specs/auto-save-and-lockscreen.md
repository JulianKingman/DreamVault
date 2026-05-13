# Auto-Save Journal Entries + Lock Screen Auto-Transition

## Problem

Two friction points:

1. **Manual save on dream entry.** The new-dream form (`components/NewDreamForm.tsx`) and edit mode of the view-dream screen (`app/view-dream.tsx`) both require pressing a "Complete" / "Save" button. Risk of data loss if the modal is dismissed before tapping save; also extra friction for a journaling app where flow matters.
2. **Lock screen doesn't auto-advance after Face ID.** `components/LockScreen.tsx` calls `authenticate()` on mount, but the user reports the screen stays mounted after a successful scan and they have to tap "Unlock" to proceed.

## Goal

1. Auto-save dream entries (new and edited) on debounced typing — no save button needed.
2. After successful biometric auth, the lock screen exits automatically.

---

## Issue 1: Auto-Save

### Behavior (new-dream form)

- The dream row is created as soon as the main "Dream" content field has non-whitespace text.
- Once created, all field changes (date, intention, content, notes, tags) are persisted on debounced input (300ms).
- If main content is cleared back to empty after auto-save, the auto-created dream is deleted (no empty rows).
- "Complete" button becomes a navigation-only button: `router.back()`. It is no longer the save trigger.
- "Save and Add Another Dream" likewise navigates to a fresh form; the current one is already persisted.
- If the user dismisses the modal (swipe-down, X) without ever typing dream content, nothing is saved.
- Intention is saved on debounce just like content (the existing `setIntention(dateKey, ...)` upserts by date).
- Tag changes (`setDreamTags`) fire immediately on add/remove since they're discrete actions, not debounced text.
- AI-suggested tags are persisted as soon as they're added.

### Behavior (view-dream edit)

- Edit mode entered the same way (Edit button on action bar).
- All field changes auto-save on 300ms debounce via `updateDream()` and `setDreamTags()`.
- "Cancel" button is removed (or becomes "Done") — there is nothing to cancel since saves are committed live.
- "Save" button is removed; mode exits via "Done" or back gesture.

### Implementation sketch

**NewDreamForm.tsx**
- Add `dreamId: number | null` state, initially `null`.
- Add a `useDebouncedEffect` (or `useEffect` + `setTimeout`) keyed on `[content, intention, notes, dreamDate]`:
  - If `content.trim().length === 0`:
    - If `dreamId !== null`, call `deleteDream(dreamId)` and set `dreamId = null`.
    - Else no-op.
  - Else:
    - If `dreamId === null`, call `addDream(content, undefined, notes, dreamDate)`, store id, then `setDreamTags(id, selectedTags)` and `setIntention(dateKey, intention)`.
    - Else, call `updateDream({ id: dreamId, content, notes, ... dream fields })` and `setIntention(dateKey, intention)`.
- Tags: when `selectedTags` changes, if `dreamId !== null`, call `setDreamTags(dreamId, selectedTags)` immediately (no debounce).
- Show a small "Saved" / "Saving…" indicator near the date row for affordance.
- `handleComplete` → `router.back()`.
- `handleSaveAndAdd` → `router.replace({ pathname: '/new-dream', params: { prefillDate, prefillIntention } })`.
- Drop `canSubmit` gating on "Complete" — always allow exit, but the dream only persists if content is non-empty.

**view-dream.tsx**
- Replace the `handleSave` flow: trigger on debounced changes to `editedContent`, `editedNotes`.
- `editedTags` triggers `setDreamTags()` directly on add/remove.
- Show "Saved" / "Saving…" affordance.
- "Cancel" / "Save" buttons replaced with a single "Done" button that calls `setIsEditing(false)`.

### Helper: debounced effect

If the codebase doesn't already have one, add `hooks/useDebouncedEffect.ts`:

```typescript
import { useEffect, DependencyList } from 'react';

export function useDebouncedEffect(
  effect: () => void | (() => void),
  delay: number,
  deps: DependencyList
) {
  useEffect(() => {
    const handle = setTimeout(effect, delay);
    return () => clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, delay]);
}
```

(Quick check first — there may already be one or a `lodash.debounce` import we can reuse.)

### Edge cases

- **Modal dismissed mid-debounce:** the debounce timer is cleared on unmount. Last change won't flush. Fix: in the cleanup, fire a synchronous "flush" save if there are unsaved changes. Track `dirty` state.
- **AppState going background mid-typing:** same — flush on `AppState` change to `inactive` / `background`.
- **`dateModified` correctness:** `updateDream()` already sets `dateModified = now`. Good.
- **Real-time list updates:** `addDream`/`updateDream`/`deleteDream` already call `emit(DB_CHANGE)`, so the list view will reflect changes via `useDreams`.

---

## Issue 2: Lock Screen Auto-Transition

### Investigation

`LockScreen.tsx` calls `authenticate()` in `useEffect` on mount. `authenticate()` calls `getDbKey()` which awaits `SecureStore.getItemAsync(..., { requireAuthentication: true })`, then `setIsAuthenticated(true)`. The root layout (`app/_layout.tsx`) swaps to the main stack when `isAuthenticated` flips to true.

If the user reports a successful scan but no transition, the leading hypotheses:

1. **`getDbKey()` returns `null`.** If the SecureStore call throws (e.g., transient enclave issue) the catch block falls through to a non-auth read which may return `null`. `authenticate()` then returns `false` without setting `isAuthenticated`, leaving the lock screen mounted with no error feedback. Tapping "Unlock" re-runs and succeeds because the key cache is now warm.
2. **Silent error in `initDatabase(key)`.** If init throws, the surrounding try/catch logs and returns false; same outcome as above.
3. **State update timing.** Less likely — React would render within a frame.

### Fix

- Add visible state to LockScreen: `idle` / `scanning` / `error`.
- In `AuthContext.authenticate()`, distinguish "user cancelled" from "got null key" from "init failed" — return a discriminated result, not just a boolean.
- LockScreen consumes that result. On error, show an error message + retry button. On success, the layout swap happens automatically (state-driven).
- Add an `onAuthError` console log path so the actual failure mode is visible during dev.
- The "Unlock" button stays as a retry affordance — but only enabled in `idle` or `error` state, not during `scanning`.
- Do NOT auto-trigger `authenticate()` again on every render — keep the single mount-effect, but wire the retry button to call it.

### Implementation sketch

**AuthContext.tsx**
```typescript
type AuthResult =
  | { ok: true }
  | { ok: false; reason: 'cancelled' | 'no-key' | 'init-failed'; error?: unknown };

const authenticate = useCallback(async (): Promise<AuthResult> => { ... });
```

Update `AuthContextValue.authenticate` signature. Update `LockScreen` to act on the discriminated result.

**LockScreen.tsx**
- `useState<'idle' | 'scanning' | 'error'>('idle')`
- `useState<string | null>(null)` for the error message
- On mount, set `scanning`, await `authenticate()`, branch on result.

---

## Out of Scope

- Server-side sync changes (existing `useSync` / `SyncContext` continues to work — auto-saved dreams will sync the same way as manual ones since they go through `addDream`/`updateDream`).
- Migration changes — schema is unchanged.
- Conflict resolution if a dream is edited on another device mid-edit (existing sync semantics, untouched).

## Open Questions

1. Should the auto-saved row be visible in the list immediately while still being typed, or hidden until the user closes the form? (Default: visible — matches `emit(DB_CHANGE)` already firing.)
2. For the empty-after-typed case, do we want a 1–2 second grace window before deleting (in case the user is mid-edit clearing to retype)? (Default: yes, the same 300ms debounce applies; the delete only fires after debounce settles on empty.)
3. "Save and Add Another Dream" — with auto-save, this label is misleading. Rename to "Add Another Dream"? (Default: yes.)
