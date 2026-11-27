/**
 * Pure random string helpers. No React, no DOM, no network access.
 * Every character comes from crypto.getRandomValues with rejection sampling,
 * so there is no predictable fallback and no bias from a plain modulo.
 */

export type RandomStringOptions = {
  length: number;
  count: number;
  lower: boolean;
  upper: boolean;
  digits: boolean;
  symbols: boolean;
  excludeLookAlike: boolean;
};

export const LIMITS = {
  length: { min: 1, max: 512 },
  count: { min: 1, max: 1000 },
} as const;

export const DEFAULT_OPTIONS: RandomStringOptions = {
  length: 20,
  count: 5,
  lower: true,
  upper: true,
  digits: true,
  symbols: false,
  excludeLookAlike: false,
};

/** Characters that are easy to confuse when read aloud or typed by hand. */
export const LOOK_ALIKE_CHARS = "il1ILoO0";

const SETS = {
  lower: "abcdefghijklmnopqrstuvwxyz",
  upper: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
  digits: "0123456789",
  symbols: "!@#$%^&*()-_=+[]{};:,.?",
} as const;

export type RandomStringErrorCode =
  | "unsupported"
  | "noCharset"
  | "invalidRange"
  | "failed";

/** Typed failure carrying a code instead of a raw platform exception. */
export class RandomStringError extends Error {
  readonly code: RandomStringErrorCode;

  constructor(code: RandomStringErrorCode) {
    super(code);
    this.name = "RandomStringError";
    this.code = code;
  }
}

export function randomStringErrorCode(error: unknown): RandomStringErrorCode {
  return error instanceof RandomStringError ? error.code : "failed";
}

/** Clamp a typed numeric value into the supported range. */
export function clamp(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min;
  return Math.min(max, Math.max(min, Math.trunc(value)));
}

/** crypto.getRandomValues works on HTTP too, but must still exist. */
export function getRandomValuesSupport():
  | { ok: true }
  | { ok: false; code: "unsupported" } {
  const getValues = globalThis.crypto?.getRandomValues;
  if (!getValues || typeof getValues !== "function") {
    return { ok: false, code: "unsupported" };
  }
  return { ok: true };
}

/**
 * Uniform index in [0, max) using rejection sampling. A plain modulo would
 * slightly favour the first characters of the pool, so values at or above the
 * largest exact multiple of max are discarded and redrawn.
 */
function randomIndex(max: number): number {
  const range = 0x100000000;
  const limit = Math.floor(range / max) * max;
  const values = new Uint32Array(1);
  let value = 0;

  do {
    crypto.getRandomValues(values);
    value = values[0];
  } while (value >= limit);

  return value % max;
}

function withoutLookAlikes(chars: string): string {
  const excluded = new Set(LOOK_ALIKE_CHARS.split(""));
  return [...chars].filter((char) => !excluded.has(char)).join("");
}

/** Combine the selected character sets into one unbiased pool. */
export function buildPool(options: RandomStringOptions): string {
  const groups = [
    options.lower ? SETS.lower : "",
    options.upper ? SETS.upper : "",
    options.digits ? SETS.digits : "",
    options.symbols ? SETS.symbols : "",
  ].filter(Boolean);

  if (options.excludeLookAlike) {
    return groups.map(withoutLookAlikes).join("");
  }
  return groups.join("");
}

function buildOne(pool: string, length: number): string {
  let value = "";
  for (let index = 0; index < length; index += 1) {
    value += pool[randomIndex(pool.length)];
  }
  return value;
}

/** Generate one string, or an empty string when no character set is chosen. */
export function generateString(options: RandomStringOptions): string {
  return generateBatch({ ...options, count: 1 })[0] ?? "";
}

/** Generate the requested batch of independent strings. */
export function generateBatch(options: RandomStringOptions): string[] {
  const support = getRandomValuesSupport();
  if (!support.ok) throw new RandomStringError(support.code);

  const pool = buildPool(options);
  if (!pool) throw new RandomStringError("noCharset");

  const length = clamp(options.length, LIMITS.length.min, LIMITS.length.max);
  const count = clamp(options.count, LIMITS.count.min, LIMITS.count.max);
  if (length < LIMITS.length.min || count < LIMITS.count.min) {
    throw new RandomStringError("invalidRange");
  }

  return Array.from({ length: count }, () => buildOne(pool, length));
}

/** One string per line, ready for the clipboard or a .txt download. */
export function joinBatch(values: string[]): string {
  return values.join("\n");
}
