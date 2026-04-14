/**
 * Kyber KEM (Key Encapsulation Mechanism) for post-quantum protection.
 *
 * Used to wrap the AES master key when storing it alongside iCloud sync data.
 * This provides post-quantum security for data at rest on Apple's servers.
 *
 * Flow:
 * 1. Generate Kyber keypair on first use, store private key in SecureStore
 * 2. When syncing: encapsulate AES key with Kyber public key → store ciphertext in iCloud
 * 3. When receiving: decapsulate with Kyber private key → recover AES key
 */
import * as SecureStore from 'expo-secure-store';

const KYBER_SK_ALIAS = 'dream_locket_kyber_sk';
const KYBER_PK_ALIAS = 'dream_locket_kyber_pk';

let KyberModule: any = null;

async function loadKyber() {
  if (!KyberModule) {
    // @ts-ignore - dynamic import for lazy loading
    const mod = await import('crystals-kyber-js');
    KyberModule = mod;
  }
  return KyberModule;
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function base64ToBytes(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

export async function generateKeyPair(): Promise<{ publicKey: string }> {
  const { MlKem768 } = await loadKyber();
  const kem = new MlKem768();
  const [publicKey, secretKey] = await kem.generateKeyPair();

  const pkB64 = bytesToBase64(publicKey);
  const skB64 = bytesToBase64(secretKey);

  await SecureStore.setItemAsync(KYBER_SK_ALIAS, skB64);
  await SecureStore.setItemAsync(KYBER_PK_ALIAS, pkB64);

  return { publicKey: pkB64 };
}

export async function getPublicKey(): Promise<string | null> {
  return SecureStore.getItemAsync(KYBER_PK_ALIAS);
}

/**
 * Encapsulate a shared secret using the public key.
 * Returns { ciphertext, sharedSecret } where sharedSecret can be used as AES key.
 */
export async function encapsulate(
  publicKeyB64: string
): Promise<{ ciphertext: string; sharedSecret: Uint8Array }> {
  const { MlKem768 } = await loadKyber();
  const kem = new MlKem768();
  const publicKey = base64ToBytes(publicKeyB64);
  const [ciphertext, sharedSecret] = await kem.encap(publicKey);
  return {
    ciphertext: bytesToBase64(ciphertext),
    sharedSecret,
  };
}

/**
 * Decapsulate using the stored private key to recover the shared secret.
 */
export async function decapsulate(
  ciphertextB64: string
): Promise<Uint8Array> {
  const { MlKem768 } = await loadKyber();
  const kem = new MlKem768();

  const skB64 = await SecureStore.getItemAsync(KYBER_SK_ALIAS);
  if (!skB64) throw new Error('Kyber private key not found');

  const secretKey = base64ToBytes(skB64);
  const ciphertext = base64ToBytes(ciphertextB64);
  return await kem.decap(ciphertext, secretKey);
}

export async function hasKeyPair(): Promise<boolean> {
  const sk = await SecureStore.getItemAsync(KYBER_SK_ALIAS);
  return sk !== null;
}
