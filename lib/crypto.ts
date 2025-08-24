import * as SecureStore from 'expo-secure-store';
import CryptoJS from 'crypto-js';

const CK_KEY = 'CK_v1';

async function getOrCreateContentKey(): Promise<string> {
  let key = await SecureStore.getItemAsync(CK_KEY);
  if (!key) {
    // Demo-only key generation. In production, use a cryptographically secure RNG and key derivation.
    key = Array.from({ length: 32 })
      .map(() => Math.floor(Math.random() * 36).toString(36))
      .join('');
    await SecureStore.setItemAsync(CK_KEY, key);
  }
  return key;
}

export async function encrypt(plaintext: string): Promise<string> {
  const key = await getOrCreateContentKey();
  return CryptoJS.AES.encrypt(plaintext, key).toString();
}

export async function decrypt(ciphertext: string): Promise<string> {
  const key = await getOrCreateContentKey();
  const bytes = CryptoJS.AES.decrypt(ciphertext, key);
  return bytes.toString(CryptoJS.enc.Utf8);
}

// Note: Audio files are stored locally only for MVP. TODO: Encrypt audio files in a future update.


