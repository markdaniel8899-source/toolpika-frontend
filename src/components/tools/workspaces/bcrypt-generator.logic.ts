/**
 * Pure helpers for the Web Crypto PBKDF2 workflow.
 * This workspace uses PBKDF2 SHA-256 via Web Crypto, not bcrypt.
 * The slug stays bcrypt-generator for routing compatibility.
 */

export type HashMode = "generate" | "verify";
export type PassphraseIssue = "empty" | "short";
export type HashIssue = "empty" | "format" | "iterations";

export interface Pbkdf2Parts {
  iterations: number;
  salt: string;
  digest: string;
}

export const PBKDF2_ALGORITHM = "PBKDF2-SHA256";
export const PBKDF2_PREFIX = "pbkdf2-sha256";
export const PBKDF2_DIGEST_BYTES = 32;
export const PBKDF2_SALT_BYTES = 16;
export const DEFAULT_ITERATIONS = 210000;
export const ITERATION_OPTIONS = [100000, 210000, 310000, 600000] as const;
export const MIN_PASSPHRASE_LENGTH = 8;
export const PBKDF2_SAMPLE = "CorrectHorse9!Battery";

const BASE64 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

/** Pure base64 encode, so the same helper works in logic and in the UI. */
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

/** Pure base64 decode. Returns null for malformed input. */
export function base64ToBytes(text: string): Uint8Array | null {
  const value = text.trim().replace(/=+$/u, "");
  if (!value || !/^[A-Za-z0-9+/]+$/u.test(value)) return null;
  if (value.length % 4 === 1) return null;

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

/** One portable string with version, iteration count, salt and digest. */
export function formatHash(parts: Pbkdf2Parts): string {
  return [PBKDF2_PREFIX, parts.iterations, parts.salt, parts.digest].join("$");
}

export function parseHash(text: string): Pbkdf2Parts | null {
  const sections = text.trim().split("$");
  if (sections.length !== 4 || sections[0] !== PBKDF2_PREFIX) return null;
  const iterations = Number(sections[1]);
  if (!Number.isInteger(iterations) || iterations < 10000 || iterations > 5000000) return null;
  if (!base64ToBytes(sections[2]) || !base64ToBytes(sections[3])) return null;
  return { iterations, salt: sections[2], digest: sections[3] };
}

export function checkPassphrase(value: string): PassphraseIssue | null {
  if (!value) return "empty";
  if (value.length < MIN_PASSPHRASE_LENGTH) return "short";
  return null;
}

export function checkIterations(value: number): boolean {
  return Number.isInteger(value) && value >= 10000 && value <= 5000000;
}

/** Length checked first, then a constant-work character comparison. */
export function constantTimeEqual(left: string, right: string): boolean {
  if (left.length !== right.length) return false;
  let difference = 0;
  for (let index = 0; index < left.length; index += 1) {
    difference |= left.charCodeAt(index) ^ right.charCodeAt(index);
  }
  return difference === 0;
}
