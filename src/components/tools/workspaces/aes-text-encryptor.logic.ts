/** Pure payload and validation helpers for the AES-GCM Web Crypto workspace. */

export type AesMode = "encrypt" | "decrypt";
export type AesIssue = "emptyText" | "shortPassphrase" | "format" | "base64" | "failed";

export interface AesPayload {
  salt: string;
  iv: string;
  cipher: string;
}

export const AES_SAMPLE = "The quick brown fox jumps over the lazy dog.";
export const AES_PREFIX = "AES-GCM-v1";
export const AES_ITERATIONS = 250000;
export const AES_KEY_BITS = 256;
export const AES_IV_BYTES = 12;
export const AES_SALT_BYTES = 16;
export const MIN_PASSPHRASE_LENGTH = 8;

const BASE64 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

export function bytesToBase64(bytes: Uint8Array): string {
  let output = "";
  for (let index = 0; index < bytes.length; index += 3) {
    const a = bytes[index];
    const b = index + 1 < bytes.length ? bytes[index + 1] : 0;
    const c = index + 2 < bytes.length ? bytes[index + 2] : 0;
    output += BASE64[a >> 2];
    output += BASE64[((a & 3) << 4) | (b >> 4)];
    output += index + 1 < bytes.length ? BASE64[((b & 15) << 2) | (c >> 6)] : "=";
    output += index + 2 < bytes.length ? BASE64[c & 63] : "=";
  }
  return output;
}

export function base64ToBytes(text: string): Uint8Array | null {
  const value = text.trim().replace(/=+$/u, "");
  if (!value || !/^[A-Za-z0-9+/]+$/u.test(value) || value.length % 4 === 1) return null;
  const bytes: number[] = [];
  for (let index = 0; index < value.length; index += 4) {
    const chunk = value.slice(index, index + 4);
    let bits = 0;
    for (let position = 0; position < chunk.length; position += 1) {
      const digit = BASE64.indexOf(chunk[position]);
      if (digit < 0) return null;
      bits = (bits << 6) | digit;
    }
    const produced = chunk.length - 1;
    const unused = 8 - 2 * chunk.length;
    for (let position = 0; position < produced; position += 1) {
      bytes.push((bits >> (unused + 8 * (produced - 1 - position))) & 255);
    }
  }
  return new Uint8Array(bytes);
}

export function formatAesPayload(payload: AesPayload): string {
  return [AES_PREFIX, payload.salt, payload.iv, payload.cipher].join(".");
}

export function parseAesPayload(text: string): AesPayload | null {
  const parts = text.trim().split(".");
  if (parts.length !== 4 || parts[0] !== AES_PREFIX) return null;
  return { salt: parts[1], iv: parts[2], cipher: parts[3] };
}

/** Validate input before any Web Crypto call. Errors carry a fix hint in the UI. */
export function checkAesInput(mode: AesMode, text: string, passphrase: string): AesIssue | null {
  if (!text.trim()) return "emptyText";
  if (passphrase.length < MIN_PASSPHRASE_LENGTH) return "shortPassphrase";

  if (mode === "decrypt") {
    const payload = parseAesPayload(text);
    if (!payload) return "format";
    if (!base64ToBytes(payload.salt) || !base64ToBytes(payload.iv) || !base64ToBytes(payload.cipher)) {
      return "base64";
    }
  }
  return null;
}
