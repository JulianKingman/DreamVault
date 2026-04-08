# Spec: Simplify Encryption (Trust iCloud) + Add Backup/Export

## Problem

Dream Vault has a half-built custom encryption stack that provides a false sense of security:

- **`crypto.ts`** (AES-256-GCM per-field encryption) — implemented but **never called** from any read/write path. The `encryptDream()`, `decryptDreamFields()`, and `encryptAllDreams()` functions in `database.ts` exist but are dead code. The settings UI has an "Encrypt existing dreams" button that nobody presses.
- **`crypto-kyber.ts`** (ML-KEM 768 post-quantum key wrapping) — implemented but **never integrated** into the sync pipeline. `sync.ts` writes plaintext JSON to iCloud.
- **`AuthContext`** — biometric toggle gates a UI overlay (`LockScreen`), but the database initializes unconditionally. The lock is cosmetic.
- **`isEncrypted` column** — added in migration v4, never populated, not in the `Dream` TypeScript interface.

The result: four files of crypto code, three dependencies (`react-native-aes-gcm-crypto`, `crystals-kyber-js`, `expo-local-authentication`), and a settings section — all producing zero actual data protection.

Meanwhile, there's no way to **export or back up** dreams, so a sync bug, migration failure, or accidental deletion means permanent data loss.

## Decision

**Trust Apple's encryption for iCloud. Focus effort on backup/export instead.**

iCloud provides:
- AES-128+ encryption at rest on Apple's servers (default)
- TLS in transit
- With **Advanced Data Protection** enabled by the user: full end-to-end encryption (Apple cannot read the data)

For a personal dream journal, this is sufficient. Custom application-layer crypto on top of iCloud adds complexity and key-management risk (user loses key → loses all data) without meaningfully improving the threat model.

### What about SQLCipher? (Option 2 — deferred)

The existing `specs/sqlcipher-migration.md` describes a proper implementation: database-level AES-256 via SQLCipher where biometric auth IS data access. That spec remains valid and is the right path if we later need:
- Protection against forensic device extraction
- Compliance requirements for encrypted local storage
- A "no trust" posture toward Apple

For now, it's deferred. The crypto source files will be moved to a `_future/` directory with a README explaining the intent, so the work isn't lost.

## Solution

Two changes:

1. **Strip dead crypto code** from active paths, clean up settings UI
2. **Add backup/export** so dreams can't be lost

## Scope

### In scope
- Remove dead crypto imports and functions from `database.ts`
- Remove encryption UI section from settings
- Simplify AuthContext (keep biometric lock, just make it honest about what it does)
- Remove unused dependencies: `react-native-aes-gcm-crypto`, `crystals-kyber-js`
- Keep `expo-local-authentication` (still used by AuthContext for biometric prompt)
- Move `crypto.ts` and `crypto-kyber.ts` to `_future/encryption/` with a README
- Remove `isEncrypted` column from schema definition (pre-deployment, no migration needed)
- Add JSON export (all dreams → single file)
- Add JSON import (restore from export file)
- Add iCloud info/guidance in settings

### Out of scope
- SQLCipher migration (deferred — see `specs/sqlcipher-migration.md`)
- Automated scheduled backups (future enhancement)
- Export to other formats (CSV, PDF, etc.)
- Changes to iCloud sync logic (works fine as-is)

## Detailed Design

### 1. Archive Crypto Files

Move, don't delete. The code is correct — it's just premature.

```
_future/
  encryption/
    README.md          ← explains what this is and points to the SQLCipher spec
    crypto.ts          ← AES-256-GCM per-field encryption (was utils/crypto.ts)
    crypto-kyber.ts    ← ML-KEM 768 post-quantum KEM (was utils/crypto-kyber.ts)
```

**`_future/encryption/README.md`** contents:

```markdown
# Future: Application-Layer Encryption

These files implement encryption features that were built but never integrated
into production code paths. They are preserved here for future use.

## Files

- `crypto.ts` — AES-256-GCM per-field encryption using react-native-aes-gcm-crypto.
  Master key stored in SecureStore with biometric gating.
- `crypto-kyber.ts` — ML-KEM 768 (NIST post-quantum standard) key encapsulation.
  Designed to wrap the AES master key before syncing to iCloud.

## When to revisit

If Dream Vault needs:
- Local database encryption → see `specs/sqlcipher-migration.md` (preferred approach)
- End-to-end encrypted sync independent of Apple → integrate these files into `utils/sync.ts`

## Dependencies required

To use these files, re-add:
- `react-native-aes-gcm-crypto` (for crypto.ts)
- `crystals-kyber-js` (for crypto-kyber.ts)
```

### 2. Clean Up `database.ts`

Remove the encryption section (lines ~209-248):

**Remove:**
- `import { encrypt, decrypt } from './crypto'`
- `encryptDream()` function
- `decryptDreamFields()` function
- `encryptAllDreams()` function

All other database functions remain unchanged.

### 3. Remove `isEncrypted` from Schema

Pre-deployment — no users, no migration needed. Remove `isEncrypted` directly from the v4 migration that added it, and remove any references to the column in `database.ts` queries. Delete the dream database on next dev build (or just uninstall the app) so the schema is recreated cleanly.

In `utils/migrations.ts`, edit the v4 migration to remove the `ALTER TABLE dreams ADD COLUMN isEncrypted` line.

### 4. Simplify Settings Screen

**Remove:**
- `import * as LocalAuthentication from 'expo-local-authentication'` (only if no longer needed after AuthContext cleanup — see section 5)
- `import { encryptAllDreams } from '../../utils/database'`
- `import { isEncryptionAvailable } from '../../utils/crypto'`
- `hasBiometrics` state and `LocalAuthentication.hasHardwareAsync()` check
- `hasEncryption` / `encrypting` state
- `handleEncryptAll` function
- The entire `<SettingsGroup title="Encryption">` block

**Update Security section** — always show (no `hasBiometrics` gate), describe what's real:

```tsx
<SettingsGroup title="Security">
  <SettingsItem
    icon={<Shield size={20} />}
    title="Face ID / Biometrics"
    right={
      <Switch
        size="$4"
        checked={isAuthEnabled}
        onCheckedChange={handleAuthToggle}
        native
      />
    }
  />
  <XStack paddingHorizontal="$4" paddingBottom="$3">
    <Text fontSize="$2" color="$gray10">
      Requires biometric authentication to open Dream Vault.
      iCloud data is encrypted by Apple — enable Advanced Data Protection
      in your device's iCloud settings for end-to-end encryption.
    </Text>
  </XStack>
</SettingsGroup>
```

The `handleAuthToggle` function stays but no longer needs the `LocalAuthentication.authenticateAsync` call for enabling — the existing AuthContext flow handles the actual biometric prompt on app foreground. Simplify to:

```typescript
const handleAuthToggle = (enabled: boolean) => {
  setAuthEnabled(enabled);
};
```

**Add to the Data section** — export button alongside existing import:

```tsx
<SettingsGroup title="Data">
  <SettingsItem
    icon={<Import size={20} />}
    title="Import from Notes"
    onPress={handleImportFromNotes}
  />
  <SettingsItem
    icon={<Download size={20} />}
    title="Export All Dreams"
    onPress={handleExportDreams}
    right={
      exporting ? <Spinner size="small" /> : undefined
    }
  />
  <SettingsItem
    icon={<Upload size={20} />}
    title="Restore from Backup"
    onPress={handleRestoreFromBackup}
  />
</SettingsGroup>
```

### 5. AuthContext — Keep As-Is (Minor Cleanup Only)

The current AuthContext is honest about what it does: it's a UI lock, not data encryption. That's fine for this phase. The biometric toggle (`isAuthEnabled`) and foreground re-lock behavior are useful UX features.

**Only change:** Remove the `expo-local-authentication` import from `settings.tsx` (it's already used correctly in AuthContext itself — settings shouldn't import it directly).

AuthContext keeps `expo-local-authentication` as its biometric mechanism. No changes to `contexts/AuthContext.tsx`.

### 6. Backup/Export Feature (`utils/backup.ts` — new file)

```typescript
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { getDreams, getAllTags, addDreamBulk } from './database';
import type { Dream } from '../types';

export interface DreamBackup {
  version: 1;
  exportedAt: string;
  dreamCount: number;
  dreams: BackupDream[];
}

interface BackupDream {
  uuid: string;
  content: string;
  title: string | null;
  intention: string | null;
  notes: string | null;
  isFavorite: boolean;
  dateCreated: string;   // ISO 8601
  dateModified: string;  // ISO 8601
  tags: string[];
}

/**
 * Export all dreams to a JSON file and open the system share sheet.
 * Returns the file URI for testing/programmatic use.
 */
export async function exportDreams(): Promise<string> {
  const dreams = getDreams();

  const backupDreams: BackupDream[] = dreams.map(d => ({
    uuid: d.uuid ?? crypto.randomUUID(),
    content: d.content,
    title: d.title,
    intention: d.intention,
    notes: d.notes,
    isFavorite: d.isFavorite,
    dateCreated: d.dateCreated.toISOString(),
    dateModified: d.dateModified.toISOString(),
    tags: d.tags?.map(t => t.name) ?? [],
  }));

  const backup: DreamBackup = {
    version: 1,
    exportedAt: new Date().toISOString(),
    dreamCount: backupDreams.length,
    dreams: backupDreams,
  };

  const dateStr = new Date().toISOString().split('T')[0];
  const fileName = `dream-vault-backup-${dateStr}.json`;
  const fileUri = `${FileSystem.documentDirectory}${fileName}`;

  await FileSystem.writeAsStringAsync(fileUri, JSON.stringify(backup, null, 2));

  // Open share sheet so user can save to Files, AirDrop, etc.
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(fileUri, {
      mimeType: 'application/json',
      dialogTitle: 'Save Dream Vault Backup',
      UTI: 'public.json',
    });
  }

  return fileUri;
}

/**
 * Import dreams from a backup JSON file.
 * Returns the number of dreams imported.
 * Skips dreams that already exist (matched by UUID).
 */
export async function importFromBackup(fileUri: string): Promise<number> {
  const content = await FileSystem.readAsStringAsync(fileUri);
  const backup: DreamBackup = JSON.parse(content);

  if (!backup.version || !backup.dreams || !Array.isArray(backup.dreams)) {
    throw new Error('Invalid backup file format');
  }

  const dreamsToImport = backup.dreams.map(d => ({
    content: d.content,
    title: d.title ?? undefined,
    intention: d.intention ?? undefined,
    notes: d.notes ?? undefined,
    isFavorite: d.isFavorite,
    dateCreated: d.dateCreated,
    dateModified: d.dateModified,
    uuid: d.uuid,
    tags: d.tags,
  }));

  // addDreamBulk should handle UUID dedup (skip if UUID already exists)
  return addDreamBulk(dreamsToImport);
}
```

**Dependency:** `expo-sharing` — needs to be added.

```bash
npx expo install expo-sharing
```

### 7. Settings Handlers for Export/Import

Add to `settings.tsx`:

```typescript
import * as DocumentPicker from 'expo-document-picker';
import { exportDreams, importFromBackup } from '../../utils/backup';

// ... inside component:

const [exporting, setExporting] = useState(false);

const handleExportDreams = async () => {
  setExporting(true);
  try {
    await exportDreams();
  } catch (e: any) {
    Alert.alert('Export Failed', e.message ?? 'Could not export dreams.');
  } finally {
    setExporting(false);
  }
};

const handleRestoreFromBackup = async () => {
  try {
    const result = await DocumentPicker.getDocumentAsync({
      type: 'application/json',
      copyToCacheDirectory: true,
    });

    if (result.canceled) return;

    const file = result.assets[0];
    Alert.alert(
      'Restore from Backup',
      'This will import dreams from the backup file. Existing dreams will not be duplicated. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Restore',
          onPress: async () => {
            try {
              const count = await importFromBackup(file.uri);
              Alert.alert('Restored', `Imported ${count} dream(s) from backup.`);
            } catch (e: any) {
              Alert.alert('Restore Failed', e.message ?? 'Could not read backup file.');
            }
          },
        },
      ]
    );
  } catch (e: any) {
    Alert.alert('Error', e.message ?? 'Could not open file picker.');
  }
};
```

### 8. Remove Unused Dependencies

```bash
npx expo uninstall react-native-aes-gcm-crypto crystals-kyber-js
npx expo install expo-sharing
```

Keep:
- `expo-local-authentication` — still used by AuthContext
- `expo-secure-store` — still used by AuthContext (MMKV key storage)
- `react-native-cloud-store` — still used by sync

## Files Changed

| File | Action | Description |
|---|---|---|
| `utils/crypto.ts` | **Move** → `_future/encryption/crypto.ts` | Archive, not delete |
| `utils/crypto-kyber.ts` | **Move** → `_future/encryption/crypto-kyber.ts` | Archive, not delete |
| `_future/encryption/README.md` | **New** | Explains archived files and when to revisit |
| `utils/database.ts` | **Edit** | Remove `encryptDream`, `decryptDreamFields`, `encryptAllDreams`, crypto imports |
| `utils/migrations.ts` | **Edit** | Remove `isEncrypted` from v4 migration (pre-deployment, no compat needed) |
| `utils/backup.ts` | **New** | Export/import dream backup as JSON |
| `app/(tabs)/settings.tsx` | **Edit** | Remove encryption section, add export/restore buttons, simplify security description |
| `specs/sqlcipher-migration.md` | **Keep** | Still valid for future Option 2 |
| `package.json` | **Edit** | Remove `react-native-aes-gcm-crypto`, `crystals-kyber-js`; add `expo-sharing` |

## Implementation Order

1. Archive crypto files to `_future/encryption/`
2. Clean `database.ts` — remove dead encryption functions and imports
3. Remove `isEncrypted` from v4 migration in `migrations.ts`
4. Add `utils/backup.ts`
5. Update `settings.tsx` — remove encryption UI, add export/restore
6. Remove unused deps, add `expo-sharing`
7. Delete app from simulator (clean DB rebuild without `isEncrypted` column)
8. Test: export → verify JSON → restore on fresh install → verify dreams appear

## Risks & Mitigations

1. **`addDreamBulk` UUID dedup** — Need to verify the existing bulk insert respects UUID uniqueness. If it doesn't, `importFromBackup` could create duplicates. Mitigation: check for existing UUID before each insert in the restore path.

2. **Large export files** — A user with thousands of long dreams could produce a multi-MB JSON file. Mitigation: JSON is lightweight for text content; even 10,000 dreams with 500 words each is ~30MB, well within mobile file handling limits. Streaming export is not needed yet.

3. **Backup file tampering** — A malicious JSON file could inject SQL or malformed data. Mitigation: all database writes go through parameterized queries (already the case in `addDreamBulk`), so SQL injection is not a risk. Validate required fields on import.

4. ~~Users who already pressed "Encrypt existing dreams"~~ — **N/A.** Pre-deployment, no real users. No encrypted rows exist.
