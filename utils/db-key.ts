import * as SecureStore from 'expo-secure-store';

const DB_KEY_ALIAS = 'dream_vault_db_key';
const DB_KEY_FLAG = 'dream_vault_db_key_exists'; // non-protected existence check

/**
 * Generate a random 256-bit hex key.
 * Uses crypto.getRandomValues if available, falls back to Math.random.
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
 * Uses a separate non-protected flag since the actual key may require
 * authentication to read.
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
 * Retrieve the DB encryption key, requiring biometric authentication.
 * Falls back to unprotected retrieval if requireAuthentication fails
 * (e.g. simulator with no passcode).
 * Returns null if the user cancels.
 */
export async function getDbKey(): Promise<string | null> {
  try {
    const key = await SecureStore.getItemAsync(DB_KEY_ALIAS, {
      requireAuthentication: true,
      authenticationPrompt: 'Unlock Dream Vault',
    });
    return key;
  } catch {
    // requireAuthentication not supported (no passcode/biometric)
    try {
      return await SecureStore.getItemAsync(DB_KEY_ALIAS);
    } catch {
      return null;
    }
  }
}

/**
 * Generate and store a new DB encryption key.
 * Tries biometric-protected storage; falls back to plain SecureStore.
 * Also stores a non-protected flag for hasDbKey() checks.
 */
export async function createDbKey(): Promise<string> {
  const key = generateRandomKey();
  console.log('[db-key] Generated key, attempting to store...');

  try {
    await SecureStore.setItemAsync(DB_KEY_ALIAS, key, {
      requireAuthentication: true,
      authenticationPrompt: 'Set up Dream Vault encryption',
    });
    console.log('[db-key] Stored with auth protection');
  } catch (e) {
    console.log('[db-key] Auth storage failed, falling back:', e);
    await SecureStore.setItemAsync(DB_KEY_ALIAS, key);
    console.log('[db-key] Stored without auth protection');
  }

  // Store non-protected flag so hasDbKey() works without triggering biometric
  await SecureStore.setItemAsync(DB_KEY_FLAG, '1');

  return key;
}

/**
 * Delete the DB key. This makes the encrypted database unrecoverable.
 */
export async function deleteDbKey(): Promise<void> {
  await SecureStore.deleteItemAsync(DB_KEY_ALIAS);
  await SecureStore.deleteItemAsync(DB_KEY_FLAG);
}
