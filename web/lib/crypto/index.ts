import CryptoJS from "crypto-js";

// Encryption configuration
const ALGORITHM = "AES-GCM";
const KEY_SIZE = 256;
const IV_SIZE = 12; // 96 bits for GCM
const TAG_SIZE = 128; // bits
const SALT_SIZE = 16; // bytes

/**
 * Generate a random encryption key (32 bytes)
 */
export function generateEncryptionKey(): string {
  const key = CryptoJS.lib.WordArray.random(32);
  return key.toString(CryptoJS.enc.Base64);
}

/**
 * Encrypt data using AES-256-GCM
 * @param data - Data to encrypt (string or object)
 * @param key - Encryption key (base64 encoded 32-byte key)
 * @returns Base64 encoded encrypted data (IV + ciphertext + auth tag)
 */
export function encrypt(data: string | object, key: string): string {
  try {
    // Convert key from base64
    const encryptionKey = CryptoJS.enc.Base64.parse(key);
    
    // Generate random IV (12 bytes for GCM)
    const iv = CryptoJS.lib.WordArray.random(IV_SIZE);
    
    // Convert data to string if it's an object
    const dataString = typeof data === "string" ? data : JSON.stringify(data);
    
    // Encrypt using AES-GCM
    const encrypted = CryptoJS.AES.encrypt(
      dataString,
      encryptionKey,
      {
        iv: iv,
        mode: CryptoJS.mode.GCM,
        padding: CryptoJS.pad.Pkcs7,
      }
    );
    
    // Combine IV + ciphertext + tag
    // GCM produces: ciphertext + tag (16 bytes)
    const ivString = CryptoJS.enc.Base64.stringify(iv);
    const ciphertextString = encrypted.toString();
    
    // Return as: IV:ciphertext:tag (but CryptoJS already includes tag in ciphertext)
    // We need to extract the tag separately
    const ciphertext = encrypted.ciphertext;
    const tag = encrypted.tag;
    
    // Combine: IV + ciphertext + tag
    const combined = ivString + ":" + ciphertext.toString(CryptoJS.enc.Base64) + ":" + tag.toString(CryptoJS.enc.Base64);
    
    return combined;
  } catch (error) {
    console.error("Encryption failed:", error);
    throw new Error("Failed to encrypt data");
  }
}

/**
 * Decrypt data using AES-256-GCM
 * @param encryptedData - Encrypted data (IV:ciphertext:tag)
 * @param key - Encryption key (base64 encoded 32-byte key)
 * @returns Decrypted data as string
 */
export function decrypt(encryptedData: string, key: string): string {
  try {
    // Parse the combined string
    const parts = encryptedData.split(":");
    if (parts.length !== 3) {
      throw new Error("Invalid encrypted data format");
    }
    
    const ivString = parts[0];
    const ciphertextString = parts[1];
    const tagString = parts[2];
    
    // Convert from base64
    const encryptionKey = CryptoJS.enc.Base64.parse(key);
    const iv = CryptoJS.enc.Base64.parse(ivString);
    const ciphertext = CryptoJS.enc.Base64.parse(ciphertextString);
    const tag = CryptoJS.enc.Base64.parse(tagString);
    
    // Create encrypted object
    const encrypted = CryptoJS.lib.CipherParams.create({
      ciphertext: ciphertext,
      tag: tag,
    });
    
    // Decrypt
    const decrypted = CryptoJS.AES.decrypt(
      encrypted,
      encryptionKey,
      {
        iv: iv,
        mode: CryptoJS.mode.GCM,
        padding: CryptoJS.pad.Pkcs7,
      }
    );
    
    return decrypted.toString(CryptoJS.enc.Utf8);
  } catch (error) {
    console.error("Decryption failed:", error);
    throw new Error("Failed to decrypt data");
  }
}

/**
 * Encrypt an object and return as base64 string
 */
export function encryptObject<T>(data: T, key: string): string {
  return encrypt(data, key);
}

/**
 * Decrypt a base64 string to an object
 */
export function decryptObject<T>(encryptedData: string, key: string): T {
  const decrypted = decrypt(encryptedData, key);
  try {
    return JSON.parse(decrypted) as T;
  } catch {
    return decrypted as unknown as T;
  }
}

/**
 * Hash a string using SHA-256
 */
export function hashString(data: string): string {
  return CryptoJS.SHA256(data).toString(CryptoJS.enc.Hex);
}

/**
 * Generate a secure random token
 */
export function generateToken(length: number = 32): string {
  const randomBytes = CryptoJS.lib.WordArray.random(length);
  return randomBytes.toString(CryptoJS.enc.Hex);
}

/**
 * Validate encryption key
 */
export function validateEncryptionKey(key: string): boolean {
  try {
    const decoded = CryptoJS.enc.Base64.parse(key);
    return decoded.sigBytes === 32; // 256 bits = 32 bytes
  } catch {
    return false;
  }
}

/**
 * Create a secure hash for password comparison
 */
export async function hashPassword(password: string): Promise<string> {
  // Use bcrypt via the bcryptjs package
  const bcrypt = await import("bcryptjs");
  const saltRounds = 12;
  return await bcrypt.hash(password, saltRounds);
}

/**
 * Compare password with hash
 */
export async function comparePassword(password: string, hash: string): Promise<boolean> {
  const bcrypt = await import("bcryptjs");
  return await bcrypt.compare(password, hash);
}

// Export types
export interface EncryptionResult {
  iv: string;
  ciphertext: string;
  tag: string;
  combined: string;
}
