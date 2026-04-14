import * as SecureStore from 'expo-secure-store';
import AesGcmCrypto from 'react-native-aes-gcm-crypto';

const MASTER_KEY_ALIAS = 'dream_locket_master_key';

async function getOrCreateMasterKey(): Promise<string> {
  let key = await SecureStore.getItemAsync(MASTER_KEY_ALIAS, {
    requireAuthentication: true,
    authenticationPrompt: 'Authenticate to access encryption keys',
  });

  if (!key) {
    // Generate a random 256-bit key (hex-encoded = 64 chars)
    const bytes = new Uint8Array(32);
    for (let i = 0; i < 32; i++) {
      bytes[i] = Math.floor(Math.random() * 256);
    }
    key = Array.from(bytes)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    await SecureStore.setItemAsync(MASTER_KEY_ALIAS, key, {
      requireAuthentication: true,
      authenticationPrompt: 'Authenticate to store encryption keys',
    });
  }

  return key;
}

export async function encrypt(plaintext: string): Promise<string> {
  const key = await getOrCreateMasterKey();
  const result = await AesGcmCrypto.encrypt(plaintext, false, key);
  // result contains { iv, tag, content } — pack as JSON
  return JSON.stringify(result);
}

export async function decrypt(ciphertext: string): Promise<string> {
  const key = await getOrCreateMasterKey();
  const { iv, tag, content } = JSON.parse(ciphertext);
  return await AesGcmCrypto.decrypt(content, key, iv, tag, false);
}

export async function isEncryptionAvailable(): Promise<boolean> {
  return SecureStore.isAvailableAsync();
}

export async function getMasterKeyExists(): Promise<boolean> {
  try {
    const key = await SecureStore.getItemAsync(MASTER_KEY_ALIAS);
    return key !== null;
  } catch {
    return false;
  }
}
