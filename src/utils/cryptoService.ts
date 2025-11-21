import crypto from "crypto";

/**
 * Cryptography Service for encrypting and decrypting sensitive data
 * Uses AES-256-GCM for encryption
 *
 * Requirements:
 * - Set API_ENCRYPTION_KEY in .env (must be 32 bytes/64 hex characters)
 * - Example: openssl rand -hex 32
 */

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 16; // For AES, this is always 16 bytes
const AUTH_TAG_LENGTH = 16;
const ENCODING: BufferEncoding = "hex";

/**
 * Gets the encryption key from environment variable
 * @throws Error if API_ENCRYPTION_KEY is not set or invalid
 */
function getEncryptionKey(): Buffer {
  const key = process.env.API_ENCRYPTION_KEY;

  if (!key) {
    throw new Error("API_ENCRYPTION_KEY environment variable is not set");
  }

  // Expect a 32-byte hex string (64 characters)
  if (key.length !== 64) {
    throw new Error(
      "API_ENCRYPTION_KEY must be 32 bytes (64 hex characters). Generate with: openssl rand -hex 32"
    );
  }

  return Buffer.from(key, "hex");
}

/**
 * Encrypts a plaintext string using AES-256-GCM
 * @param plaintext - The text to encrypt
 * @returns Encrypted string in format: iv:authTag:encryptedData (all hex-encoded)
 */
export function encrypt(plaintext: string): string {
  if (!plaintext) {
    throw new Error("Cannot encrypt empty string");
  }

  try {
    const key = getEncryptionKey();
    const iv = crypto.randomBytes(IV_LENGTH);

    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

    let encrypted = cipher.update(plaintext, "utf8", ENCODING);
    encrypted += cipher.final(ENCODING);

    const authTag = cipher.getAuthTag();

    // Return format: iv:authTag:encryptedData
    return `${iv.toString(ENCODING)}:${authTag.toString(
      ENCODING
    )}:${encrypted}`;
  } catch (error) {
    console.error("Encryption error:", error);
    throw new Error("Failed to encrypt data");
  }
}

/**
 * Decrypts an encrypted string using AES-256-GCM
 * @param encryptedText - The encrypted text in format: iv:authTag:encryptedData
 * @returns Decrypted plaintext string
 */
export function decrypt(encryptedText: string): string {
  if (!encryptedText) {
    throw new Error("Cannot decrypt empty string");
  }

  try {
    const key = getEncryptionKey();

    // Parse the encrypted format
    const parts = encryptedText.split(":");
    if (parts.length !== 3) {
      throw new Error("Invalid encrypted data format");
    }

    const ivHex = parts[0]!;
    const authTagHex = parts[1]!;
    const encryptedData = parts[2]!;

    const iv = Buffer.from(ivHex, ENCODING);
    const authTag = Buffer.from(authTagHex, ENCODING);

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);

    const decryptedBuffer = decipher.update(encryptedData, ENCODING, "utf8");
    const finalBuffer = decipher.final("utf8");

    return decryptedBuffer + finalBuffer;
  } catch (error) {
    console.error("Decryption error:", error);
    throw new Error("Failed to decrypt data");
  }
}

/**
 * Validates that the encryption key is properly configured
 * @returns true if key is valid, false otherwise
 */
export function validateEncryptionKey(): boolean {
  try {
    getEncryptionKey();
    return true;
  } catch {
    return false;
  }
}

/**
 * Tests encryption and decryption functionality
 * @returns true if test passes, false otherwise
 */
export function testEncryption(): boolean {
  try {
    const testString = "test-encryption-12345";
    const encrypted = encrypt(testString);
    const decrypted = decrypt(encrypted);
    return testString === decrypted;
  } catch {
    return false;
  }
}
