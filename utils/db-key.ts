import * as SecureStore from 'expo-secure-store';

const DB_KEY_ALIAS = 'dream_locket_db_key';
const DB_KEY_FLAG = 'dream_locket_db_key_exists'; // non-protected existence check

/**
 * Generate a random 256-bit hex key.
 */
function generateRandomKey(): string {
  const bytes = new Uint8Array(32);

  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < 32; i++) {
      bytes[i] = Math.floor(Math.random() * 256);
    }
  }

  return Array.from(bytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Check if a DB key has been created (without triggering biometric prompt).
 */
export async function hasDbKey(): Promise<boolean> {
  try {
    const flag = await SecureStore.getItemAsync(DB_KEY_FLAG);
    return flag === '1';
  } catch {
    return false;
  }
}

/**
 * Retrieve the DB encryption key. If `requireAuth` is true, biometric auth
 * is required; otherwise the key is read silently (works when the key was
 * stored without an auth ACL).
 */
export async function getDbKey(requireAuth: boolean = true): Promise<string | null> {
  if (!requireAuth) {
    try {
      return await SecureStore.getItemAsync(DB_KEY_ALIAS);
    } catch {
      return null;
    }
  }
  try {
    return await SecureStore.getItemAsync(DB_KEY_ALIAS, {
      requireAuthentication: true,
      authenticationPrompt: 'Unlock Dream Locket',
    });
  } catch {
    // Fall back to non-auth read in case the item isn't actually protected
    // (e.g. simulator with no biometrics).
    try {
      return await SecureStore.getItemAsync(DB_KEY_ALIAS);
    } catch {
      return null;
    }
  }
}

/**
 * Generate and store a new DB encryption key with the requested protection.
 * Falls back to non-protected storage if the protected store fails
 * (e.g. no enrolled biometric).
 */
export async function createDbKey(authRequired: boolean = false): Promise<string> {
  const key = generateRandomKey();
  console.log('[db-key] Generated key, attempting to store...', { authRequired });

  if (authRequired) {
    try {
      await SecureStore.setItemAsync(DB_KEY_ALIAS, key, {
        requireAuthentication: true,
        authenticationPrompt: 'Set up Dream Locket encryption',
      });
      console.log('[db-key] Stored with auth protection');
    } catch (e) {
      console.log('[db-key] Auth storage failed, falling back:', e);
      await SecureStore.setItemAsync(DB_KEY_ALIAS, key);
    }
  } else {
    await SecureStore.setItemAsync(DB_KEY_ALIAS, key);
    console.log('[db-key] Stored without auth protection');
  }

  // Non-protected flag so hasDbKey() works without biometric.
  await SecureStore.setItemAsync(DB_KEY_FLAG, '1');

  return key;
}

/**
 * Re-store the DB key with a different protection level. Reads the current
 * key (will trigger biometric if currently auth-protected), then re-stores
 * with the requested protection. Returns false if the read failed or the
 * user cancelled.
 */
export async function setKeyProtection(authRequired: boolean): Promise<boolean> {
  // Try the silent (no-auth) read first — succeeds if currently unprotected.
  let key: string | null = null;
  try {
    key = await SecureStore.getItemAsync(DB_KEY_ALIAS);
  } catch {
    /* item likely has biometric ACL; will fall through to auth read */
  }
  if (!key) {
    try {
      key = await SecureStore.getItemAsync(DB_KEY_ALIAS, {
        requireAuthentication: true,
        authenticationPrompt: 'Authenticate to update Face ID setting',
      });
    } catch {
      return false;
    }
  }
  if (!key) return false;

  try {
    await SecureStore.deleteItemAsync(DB_KEY_ALIAS);
    if (authRequired) {
      try {
        await SecureStore.setItemAsync(DB_KEY_ALIAS, key, {
          requireAuthentication: true,
          authenticationPrompt: 'Unlock Dream Locket',
        });
      } catch {
        // No biometric enrolled — restore without protection so we don't
        // lock the user out.
        await SecureStore.setItemAsync(DB_KEY_ALIAS, key);
        return false;
      }
    } else {
      await SecureStore.setItemAsync(DB_KEY_ALIAS, key);
    }
    return true;
  } catch (e) {
    console.error('[db-key] Failed to update key protection:', e);
    return false;
  }
}

/**
 * Delete the DB key. This makes the encrypted database unrecoverable.
 */
export async function deleteDbKey(): Promise<void> {
  await SecureStore.deleteItemAsync(DB_KEY_ALIAS);
  await SecureStore.deleteItemAsync(DB_KEY_FLAG);
}
