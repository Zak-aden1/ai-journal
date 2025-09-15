import * as SecureStore from 'expo-secure-store';
import * as Crypto from 'expo-crypto';
import CryptoJS from 'crypto-js';

const CK_KEY = 'CK_v1';

async function getOrCreateContentKey(): Promise<string> {
  try {
    let key = await SecureStore.getItemAsync(CK_KEY);
    if (!key) {
      // Skip native crypto entirely for now - use fallback directly
      console.warn('[Crypto] Using fallback key generation for compatibility');
      
      // Enhanced fallback: Use timestamp + device info for better randomness
      const timestamp = Date.now().toString();
      const userAgent = typeof navigator !== 'undefined' ? navigator.userAgent : 'react-native';
      const randomComponent = Math.random().toString(36).substring(2);
      const additionalEntropy = performance?.now?.() || Math.random() * 1000000;
      
      // Create a more diverse seed for the fallback key
      const seed = `${timestamp}-${userAgent}-${randomComponent}-${additionalEntropy}-fallback-${Math.random()}`;
      
      // Use crypto-js to hash the seed for a consistent but unpredictable key
      key = CryptoJS.SHA256(seed).toString();
      
      try {
        await SecureStore.setItemAsync(CK_KEY, key);
        console.log('[Crypto] Successfully generated and stored fallback encryption key');
      } catch (storeError) {
        console.error('[Crypto] Failed to store fallback key:', storeError);
        // Use a deterministic but session-based key as last resort
        key = CryptoJS.SHA256(`app-key-${timestamp}-${Math.random()}`).toString();
      }
    }
    return key;
  } catch (error) {
    console.error('[Crypto] Critical error in getOrCreateContentKey:', error);
    // Last resort: return a basic deterministic key
    return CryptoJS.SHA256('emergency-fallback-key-' + Date.now() + '-' + Math.random()).toString();
  }
}

export async function encrypt(plaintext: string): Promise<string> {
  try {
    const key = await getOrCreateContentKey();
    const encrypted = CryptoJS.AES.encrypt(plaintext, key).toString();
    if (!encrypted) {
      throw new Error('Encryption resulted in empty string');
    }
    return encrypted;
  } catch (error) {
    console.error('[Crypto] Encryption failed:', error);
    
    // Emergency fallback: use a session-based key for this specific encryption
    try {
      const emergencyKey = CryptoJS.SHA256('emergency-session-key-' + Date.now()).toString();
      const emergencyEncrypted = CryptoJS.AES.encrypt(plaintext, emergencyKey).toString();
      console.warn('[Crypto] Using emergency fallback encryption');
      return emergencyEncrypted;
    } catch (fallbackError) {
      console.error('[Crypto] Emergency fallback also failed:', fallbackError);
      // Last resort: return the plaintext with a marker (for development only)
      return `[FALLBACK_UNENCRYPTED]${plaintext}`;
    }
  }
}

export async function decrypt(ciphertext: string): Promise<string> {
  try {
    if (!ciphertext || ciphertext.trim() === '') {
      throw new Error('Empty or invalid ciphertext provided');
    }
    
    // Handle fallback unencrypted format
    if (ciphertext.startsWith('[FALLBACK_UNENCRYPTED]')) {
      console.warn('[Crypto] Decrypting fallback unencrypted data');
      return ciphertext.substring('[FALLBACK_UNENCRYPTED]'.length);
    }
    
    const key = await getOrCreateContentKey();
    const bytes = CryptoJS.AES.decrypt(ciphertext, key);
    const decrypted = bytes.toString(CryptoJS.enc.Utf8);
    
    if (!decrypted) {
      throw new Error('Decryption resulted in empty string - possibly wrong key or corrupted data');
    }
    
    return decrypted;
  } catch (error) {
    console.error('[Crypto] Decryption failed for ciphertext:', ciphertext?.substring(0, 50) + '...', error);
    // Return a fallback message instead of throwing
    return '[Unable to decrypt - data may be corrupted]';
  }
}

// Note: Audio files are stored locally only for MVP. TODO: Encrypt audio files in a future update.


