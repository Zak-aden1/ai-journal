import * as SecureStore from 'expo-secure-store';
import * as Crypto from 'expo-crypto';
import CryptoJS from 'crypto-js';

const CK_KEY = 'CK_v1';

async function getOrCreateContentKey(): Promise<string> {
  let key = await SecureStore.getItemAsync(CK_KEY);
  if (!key) {
    try {
      // Use expo-crypto for secure random bytes
      const randomBytes = await Crypto.getRandomBytesAsync(32);
      key = Array.from(randomBytes)
        .map(byte => byte.toString(16).padStart(2, '0'))
        .join('');
      await SecureStore.setItemAsync(CK_KEY, key);
    } catch (error) {
      console.warn('[Crypto] Failed to generate secure random key, falling back to deterministic key:', error);
      // Fallback to a simple but consistent key for demo purposes
      key = 'demo-key-for-local-development-only-not-secure';
      await SecureStore.setItemAsync(CK_KEY, key);
    }
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


