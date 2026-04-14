# Spec: SQLCipher Encryption with Biometric Unlock

## Problem

Dream content is sensitive. The current per-field AES-GCM encryption is incompatible with SQLite `LIKE` search and scales poorly (one bridge crossing per field per dream). The auth/lock system is separate from data protection — the LockScreen is cosmetic (blocks UI) while the DB is readable underneath. We need a single mechanism where biometric authentication IS data access.

## Solution

Replace `expo-sqlite` with `@op-engineering/op-sqlite` (JSI/C++ bindings, no bridge) with SQLCipher for transparent AES-256 full-database encryption. The encryption key lives in SecureStore with `requireAuthentication: true`, so a single biometric prompt both authenticates the user and unlocks the database. No key = no data = no app.

## Architecture

```
App launch
  → Render LockScreen
  → SecureStore.getItemAsync(key, { requireAuthentication: true })
       → OS triggers Face ID / fingerprint / passcode fallback
  → Success: key returned → open(name, encryptionKey) → app renders
  → Fail/cancel: stay on LockScreen, show retry

App backgrounds
  → Close DB, clear key from React state
  → App returns to foreground → LockScreen → biometric → reopen

On disk: .db file is AES-256 ciphertext, useless without Keychain entry
Sync (unchanged): AES-GCM per-field + Kyber key wrapping for iCloud payloads
```

## Scope

### In scope
- Replace expo-sqlite with op-sqlite (SQLCipher backend, JSI)
- Biometric-gated key management via SecureStore `requireAuthentication`
- Unified auth: biometric prompt = DB unlock (single gate, not two)
- Rewrite AuthContext to manage DB key lifecycle, not a separate `isLocked` boolean
- Replace `addDatabaseChangeListener` with op-sqlite `reactiveExecute`
- Remove per-field encryption: drop `isEncrypted` column, remove `encryptDream()`, `decryptDreamFields()`, `encryptAllDreams()`, `crypto.ts`
- Remove `expo-local-authentication` (SecureStore handles biometric directly)
- Update settings screen: remove "Encrypt existing dreams" section, simplify Security section
- Schema migration v5: drop `isEncrypted` column

### Out of scope
- iCloud sync encryption (keep as-is: AES-GCM + Kyber in `crypto-kyber.ts`)
- FTS5 full-text search (future enhancement enabled by this change)
- UI redesign of LockScreen (keep existing design, change what it calls)
- Data migration from old DB (greenfield — no existing user data to migrate)

## Detailed Design

### 1. Installation & Config

```bash
npx expo install @op-engineering/op-sqlite
npx expo uninstall expo-sqlite expo-local-authentication react-native-aes-gcm-crypto
```

**app.json** — add op-sqlite plugin with SQLCipher enabled:

```json
{
  "plugins": [
    ["@op-engineering/op-sqlite", { "sqlcipher": true }]
  ]
}
```

Remove the `expo-sqlite` and `expo-local-authentication` entries from plugins if present.

### 2. Key Management (`utils/db-key.ts` — new file)

Single responsibility: get or create the DB encryption key, biometric-gated.

```typescript
import * as SecureStore from 'expo-secure-store';

const DB_KEY_ALIAS = 'dream_locket_db_key';

export async function getDbKey(): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(DB_KEY_ALIAS, {
      requireAuthentication: true,
      authenticationPrompt: 'Unlock Dream Locket',
    });
  } catch {
    return null; // user cancelled or biometric failed
  }
}

export async function createDbKey(): Promise<string> {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  const key = Array.from(bytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');

  await SecureStore.setItemAsync(DB_KEY_ALIAS, key, {
    requireAuthentication: true,
    authenticationPrompt: 'Set up Dream Locket encryption',
  });

  return key;
}

export async function hasDbKey(): Promise<boolean> {
  // Check without requireAuthentication — just presence
  try {
    const key = await SecureStore.getItemAsync(DB_KEY_ALIAS);
    return key !== null;
  } catch {
    return false;
  }
}

export async function deleteDbKey(): Promise<void> {
  await SecureStore.deleteItemAsync(DB_KEY_ALIAS);
}
```

**First launch**: `hasDbKey()` returns false → `createDbKey()` generates a key (triggers biometric to store it) → `getDbKey()` retrieves it (triggers biometric again, or is cached from the store call depending on OS).

**Subsequent launches**: `hasDbKey()` returns true → `getDbKey()` triggers biometric → returns key.

### 3. Database Module (`utils/database.ts` — rewrite)

```typescript
import { open, OPSQLiteConnection } from '@op-engineering/op-sqlite';
import type { Dream, Tag, SyncDreamPayload } from '../types';
import { runMigrations } from './migrations';

let db: OPSQLiteConnection | null = null;

export function initDatabase(encryptionKey: string): void {
  if (db) return;
  db = open({ name: 'dreams.db', encryptionKey });
  createSchema();
  runMigrations(db);
}

export function closeDatabase(): void {
  if (db) {
    db.close();
    db = null;
  }
}

export function getDb(): OPSQLiteConnection {
  if (!db) throw new Error('Database not initialized');
  return db;
}
```

**API mapping:**

| expo-sqlite | op-sqlite |
|---|---|
| `db.getAllSync(sql, params)` | `db.executeSync(sql, params).rows` |
| `db.getFirstSync(sql, params)` | `db.executeSync(sql, params).rows[0] ?? null` |
| `db.runSync(sql, params)` | `db.executeSync(sql, params)` (returns `{ rowsAffected, insertId }`) |
| `db.execSync(sql)` | `db.executeSync(sql)` |

All existing query functions (`getDreams`, `addDream`, `updateDream`, `toggleFavorite`, `deleteDream`, `getDreamById`, `getDreamByUUID`, `getAllTags`, `getOrCreateTag`, `setDreamTags`, `addDreamBulk`, `getModifiedSince`, `markSynced`, `upsertFromSync`) are updated to use the new call signatures. Logic stays identical.

**Removed from database.ts:**
- `encryptDream()`
- `decryptDreamFields()`
- `encryptAllDreams()`
- `import { encrypt, decrypt } from './crypto'`

### 4. AuthContext (`contexts/AuthContext.tsx` — rewrite)

The context now manages the DB key lifecycle. `isAuthenticated` means "we have the key and the DB is open." There's no separate `isAuthEnabled` toggle — encryption is always on.

```typescript
import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { getDbKey, createDbKey, hasDbKey } from '../utils/db-key';
import { initDatabase, closeDatabase } from '../utils/database';

interface AuthContextValue {
  isAuthenticated: boolean;
  isFirstLaunch: boolean;
  authenticate: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isFirstLaunch, setIsFirstLaunch] = useState(false);
  const appState = useRef(AppState.currentState);

  const authenticate = useCallback(async (): Promise<boolean> => {
    try {
      const keyExists = await hasDbKey();

      if (!keyExists) {
        // First launch: generate key (triggers biometric to store)
        setIsFirstLaunch(true);
        const key = await createDbKey();
        initDatabase(key);
        setIsAuthenticated(true);
        setIsFirstLaunch(false);
        return true;
      }

      // Subsequent launches: retrieve key (triggers biometric)
      const key = await getDbKey();
      if (!key) return false; // biometric failed or cancelled

      initDatabase(key);
      setIsAuthenticated(true);
      return true;
    } catch {
      return false;
    }
  }, []);

  // Lock when app returns from background
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState: AppStateStatus) => {
      if (
        appState.current.match(/inactive|background/) &&
        nextState === 'active' &&
        isAuthenticated
      ) {
        // Re-lock: close DB, clear auth state
        closeDatabase();
        setIsAuthenticated(false);
        // authenticate() will be triggered by LockScreen mount
      }
      appState.current = nextState;
    });

    return () => subscription.remove();
  }, [isAuthenticated]);

  return (
    <AuthContext.Provider value={{ isAuthenticated, isFirstLaunch, authenticate }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
```

Key changes from current AuthContext:
- No `isAuthEnabled` toggle — encryption + biometric is always on
- No `expo-local-authentication` — biometric comes from SecureStore
- No MMKV `auth_enabled` flag — the presence of the DB key is the source of truth
- `authenticate()` both retrieves the key AND opens the DB
- Background → foreground closes the DB and re-locks

### 5. LockScreen (`components/LockScreen.tsx` — minor update)

```typescript
import React, { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import { YStack, Text, Button } from 'tamagui';
import { Lock } from '@tamagui/lucide-icons';
import { useAuth } from '../contexts/AuthContext';

export function LockScreen() {
  const { authenticate, isFirstLaunch } = useAuth();

  useEffect(() => {
    authenticate();
  }, []);

  return (
    <YStack style={styles.container} alignItems="center" justifyContent="center" space="$6">
      <Lock size={64} color="$gray10" />
      <Text fontSize="$7" fontWeight="bold">
        Dream Locket
      </Text>
      <Text fontSize="$4" color="$gray10">
        {isFirstLaunch
          ? 'Set up biometric protection for your dreams'
          : 'Authenticate to access your dreams'}
      </Text>
      <Button size="$5" theme="active" onPress={authenticate}>
        Unlock
      </Button>
    </YStack>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000',
    zIndex: 999,
  },
});
```

Changes: removed `isAuthEnabled` check (always shows when not authenticated), added first-launch messaging.

### 6. App Layout (`app/_layout.tsx`)

```typescript
function RootLayoutInner() {
  const { resolvedTheme } = useTheme();
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  // Only init sync after DB is available
  useAutoSync(isAuthenticated);

  // Gate everything on authentication
  if (!isAuthenticated) {
    return (
      <TamaguiProvider config={config} defaultTheme={resolvedTheme}>
        <Theme name={resolvedTheme}>
          <LockScreen />
        </Theme>
      </TamaguiProvider>
    );
  }

  return (
    <TamaguiProvider config={config} defaultTheme={resolvedTheme}>
      <ThemeProvider value={resolvedTheme === 'dark' ? DarkTheme : DefaultTheme}>
        <Theme name={resolvedTheme}>
          <Stack>
            {/* ... existing screens ... */}
          </Stack>
          {/* ... FAB ... */}
        </Theme>
      </ThemeProvider>
    </TamaguiProvider>
  );
}
```

Key change: instead of overlaying `<LockScreen />` on top of the app with z-index, we now **don't render the app at all** until authenticated. No DB = no data to render = no point mounting screens. Cleaner and more secure (no briefly-visible content underneath).

### 7. Reactive Queries (`hooks/useDreams.ts`)

```typescript
import { useEffect, useState } from 'react';
import { getDb, rowToDream, attachTags } from '../utils/database';
import type { Dream } from '../types';

export function useDreams({ search = '', favoritesOnly = false }) {
  const [dreams, setDreams] = useState<Dream[]>([]);

  useEffect(() => {
    const db = getDb();
    let query = 'SELECT * FROM dreams WHERE content LIKE ? AND (isDeleted = 0 OR isDeleted IS NULL)';
    const params: string[] = [`%${search}%`];
    if (favoritesOnly) query += ' AND isFavorite = 1';
    query += ' ORDER BY dateModified DESC';

    const unsubscribe = db.reactiveExecute({
      query,
      arguments: params,
      fireOn: [{ table: 'dreams' }],
      callback: (result) => {
        setDreams((result.rows ?? []).map(row => attachTags(rowToDream(row))));
      },
    });

    return () => unsubscribe();
  }, [search, favoritesOnly]);

  return dreams;
}
```

**Open question**: need to verify `reactiveExecute` fires the callback immediately with current data (not just on subsequent changes). If not, add a manual initial load before subscribing.

### 8. Migrations (`utils/migrations.ts`)

Update to accept db instance (no longer uses module-level `openDatabaseSync`):

```typescript
import { OPSQLiteConnection } from '@op-engineering/op-sqlite';

type Migration = {
  version: number;
  up: (db: OPSQLiteConnection) => void;
};

const migrations: Migration[] = [
  // ... existing v2, v3 migrations with executeSync instead of execSync/getAllSync/runSync ...
  {
    version: 5,
    up: (db) => {
      try {
        db.executeSync('ALTER TABLE dreams DROP COLUMN isEncrypted');
      } catch {
        // SQLite < 3.35.0 doesn't support DROP COLUMN — harmless to leave
      }
    },
  },
];

export function runMigrations(db: OPSQLiteConnection): void {
  db.executeSync(`
    CREATE TABLE IF NOT EXISTS schema_version (
      version INTEGER PRIMARY KEY
    )
  `);

  const result = db.executeSync('SELECT MAX(version) as version FROM schema_version');
  const currentVersion = result.rows[0]?.version ?? 1;

  for (const migration of migrations) {
    if (migration.version > currentVersion) {
      migration.up(db);
      db.executeSync('INSERT INTO schema_version (version) VALUES (?)', [migration.version]);
    }
  }
}
```

### 9. Settings Screen (`app/(tabs)/settings.tsx`)

**Remove:**
- "Encrypt existing dreams" section (entire `<SettingsGroup title="Encryption">`)
- `handleEncryptAll` function
- `import { encryptAllDreams } from '../../utils/database'`
- `import { isEncryptionAvailable } from '../../utils/crypto'`
- `import * as LocalAuthentication from 'expo-local-authentication'`
- `hasEncryption` / `encrypting` state
- `hasBiometrics` state and hardware check

**Update Security section:**
The biometric toggle becomes informational — encryption is always on. Replace with:

```tsx
<SettingsGroup title="Security">
  <SettingsItem
    icon={<Shield size={20} />}
    title="Encryption"
    right={<Text color="$gray10" fontSize="$3">AES-256 (Always On)</Text>}
  />
  <XStack paddingHorizontal="$4" paddingBottom="$3">
    <Text fontSize="$2" color="$gray10">
      Your dream journal is encrypted on-device with AES-256 via SQLCipher.
      Biometric authentication is required to access your data.
    </Text>
  </XStack>
</SettingsGroup>
```

## Files Changed

| File | Action |
|---|---|
| `package.json` | Remove `expo-sqlite`, `expo-local-authentication`, `react-native-aes-gcm-crypto`. Add `@op-engineering/op-sqlite` |
| `app.json` | Add `["@op-engineering/op-sqlite", { "sqlcipher": true }]` plugin |
| `utils/db-key.ts` | **New** — biometric-gated encryption key management |
| `utils/database.ts` | Rewrite — op-sqlite API, remove per-field encryption functions, export `getDb`/`closeDatabase` |
| `utils/migrations.ts` | Rewrite — accept db param, op-sqlite types, add v5 migration |
| `hooks/useDreams.ts` | Rewrite — `reactiveExecute` replaces `addDatabaseChangeListener` |
| `contexts/AuthContext.tsx` | Rewrite — manages DB key lifecycle, removes `isAuthEnabled` toggle |
| `components/LockScreen.tsx` | Minor update — first-launch text, remove `isAuthEnabled` dependency |
| `app/_layout.tsx` | Gate on `isAuthenticated`, don't render app until DB is open |
| `app/(tabs)/settings.tsx` | Remove encryption section, remove biometric toggle, add info-only security section |
| `utils/crypto.ts` | **Delete** — no longer needed (per-field encryption removed) |

**Kept unchanged:**
- `utils/crypto-kyber.ts` — still used for iCloud sync key wrapping
- `contexts/SyncContext.tsx` — sync encryption is independent
- `utils/sync.ts` — may need `crypto.ts` for sync payloads; if so, extract just the AES-GCM encrypt/decrypt into a `utils/sync-crypto.ts` and delete the rest

## Risks & Mitigations

1. **expo-updates SQLite symbol conflict (iOS)**: The `sqlcipher: true` plugin option should resolve this. Verified in op-sqlite docs. If it fails, a manual config plugin sets `expo.updates.useThirdPartySQLitePod: true` in Podfile.properties.json.

2. **Key loss on device restore**: If a user restores to a new device without Keychain migration, the DB key is lost and data is unrecoverable. **Mitigation**: iCloud sync is the backup strategy. The sync layer uses its own encryption (Kyber + AES-GCM) and is independent of the local DB key.

3. **No opt-out for biometric**: The current design always requires biometric. If the device has no biometric or passcode, `requireAuthentication` will fail. **Mitigation**: detect this case (`SecureStore.isAvailableAsync()` + check for enrolled biometrics) and fall back to storing the key without `requireAuthentication`. Show a warning in settings that data is not biometric-protected.

4. **`reactiveExecute` initial callback**: Need to verify if it fires immediately. If it only fires on changes, the hook needs a manual initial query + subscription. Test during implementation.

5. **Background → foreground re-lock aggressiveness**: Currently re-locks on every return from background. Consider a grace period (e.g., 5 seconds) for quick app switches. This is a UX refinement, not a blocker.
