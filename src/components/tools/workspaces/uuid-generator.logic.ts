/**
 * Pure UUID generation and formatting helpers.
 * No DOM access: the only ambient object read here is globalThis.crypto.
 */

export type UuidVersion = 4 | 7 | "nil";
export type UuidSeparator = "newline" | "comma" | "space";

export type UuidOptions = {
  count: number;
  version: UuidVersion;
  separator: UuidSeparator;
  uppercase: boolean;
};

export const UUID_MIN_COUNT = 1;
export const UUID_MAX_COUNT = 1000;
export const NIL_UUID = "00000000-0000-0000-0000-000000000000";

export const DEFAULT_UUID_OPTIONS: UuidOptions = {
  count: 10,
  version: 4,
  separator: "newline",
  uppercase: false,
};

export const UUID_SEPARATORS: Record<UuidSeparator, string> = {
  newline: "\n",
  comma: ", ",
  space: " ",
};

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/iu;

function randomBytes(length: number): Uint8Array {
  const bytes = new Uint8Array(length);
  const source = globalThis.crypto;

  if (source && typeof source.getRandomValues === "function") {
    source.getRandomValues(bytes);
    return bytes;
  }

  // Never fall back to Math.random: predictable UUIDs are worse than no
  // UUIDs. The UI turns this into a short, actionable error message.
  throw new Error("WEB_CRYPTO_UNAVAILABLE");
}

function toHex(bytes: Uint8Array): string {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

function assemble(hex: string): string {
  return [
    hex.slice(0, 8),
    hex.slice(8, 12),
    hex.slice(12, 16),
    hex.slice(16, 20),
    hex.slice(20, 32),
  ].join("-");
}

/** RFC 4122 version 4: 122 random bits with fixed version and variant bits. */
function generateV4(): string {
  const source = globalThis.crypto;

  if (source && typeof source.randomUUID === "function") {
    try {
      return source.randomUUID();
    } catch {
      // randomUUID can be unavailable in insecure contexts; use raw bytes.
    }
  }

  const bytes = randomBytes(16);
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  return assemble(toHex(bytes));
}

/**
 * RFC 9562 version 7: a 48-bit Unix millisecond timestamp followed by
 * random bits, with version nibble 7 and RFC 4122 variant bits.
 */
function generateV7(): string {
  const bytes = randomBytes(16);
  const milliseconds = Date.now();

  bytes[0] = Math.floor(milliseconds / 0x10000000000) & 0xff;
  bytes[1] = Math.floor(milliseconds / 0x100000000) & 0xff;
  bytes[2] = Math.floor(milliseconds / 0x1000000) & 0xff;
  bytes[3] = Math.floor(milliseconds / 0x10000) & 0xff;
  bytes[4] = Math.floor(milliseconds / 0x100) & 0xff;
  bytes[5] = milliseconds & 0xff;
  bytes[6] = (bytes[6] & 0x0f) | 0x70;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;

  return assemble(toHex(bytes));
}

/** Generate a batch, clamped to the supported 1-1000 range. */
export function generateUuids(count: number, version: UuidVersion): string[] {
  const safeCount = Math.min(
    UUID_MAX_COUNT,
    Math.max(UUID_MIN_COUNT, Math.floor(Number.isFinite(count) ? count : DEFAULT_UUID_OPTIONS.count)),
  );

  if (version === "nil") return Array.from({ length: safeCount }, () => NIL_UUID);

  const make = version === 7 ? generateV7 : generateV4;
  return Array.from({ length: safeCount }, make);
}

export function validateUuid(value: string): { valid: boolean; version?: string } {
  const candidate = value.trim();
  if (!UUID_PATTERN.test(candidate)) return { valid: false };

  if (candidate.toLowerCase() === NIL_UUID) return { valid: true, version: "nil" };

  const variant = candidate[19]?.toLowerCase() ?? "";
  if (!"89ab".includes(variant)) return { valid: false };

  const digit = candidate[14];
  if (digit && digit >= "1" && digit <= "8") return { valid: true, version: `v${digit}` };

  return { valid: true, version: "unknown" };
}

export function formatUuids(list: string[], separator: string): string {
  return list.join(separator);
}
