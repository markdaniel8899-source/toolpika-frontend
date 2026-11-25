/**
 * Pure JWT inspection helpers. The DOM is never touched here: the caller
 * injects a base64 decoder (for example an atob-backed adapter).
 */

export type JwtErrorCode = "FORMAT" | "BASE64" | "JSON";

export interface JwtDecodeError {
  code: JwtErrorCode;
}

export interface JwtClaim {
  name?: string;
  value: string;
  tone: "time" | "text" | "list";
}

export interface JwtDecoded {
  header: unknown;
  payload: unknown;
  signature: string;
  parts: { header: string; payload: string; signature: string };
  claims: JwtClaim[];
  now: number;
}

export type JwtResult = JwtDecoded | JwtDecodeError;

const BASE64_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
const SEGMENT_PATTERN = /^[A-Za-z0-9_-]*$/u;

/** A documented HS256 example token used by the Try sample action. */
export const SAMPLE_JWT =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkFkYSBMb3ZlbGFjZSIsImlhdCI6MTUxNjIzOTAyMn0.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c";

class DecoderFailure extends Error {
  readonly code: JwtErrorCode;

  constructor(code: JwtErrorCode) {
    super(code);
    this.code = code;
  }
}

function fail(code: JwtErrorCode): never {
  throw new DecoderFailure(code);
}

export function isJwtError(result: JwtResult): result is JwtDecodeError {
  return "code" in result;
}

/** A small DOM-free base64 decoder used when no adapter is supplied. */
function defaultBase64Decode(value: string): string {
  let binary = "";
  let buffer = 0;
  let bits = 0;

  for (const character of value) {
    if (character === "=") break;
    const index = BASE64_ALPHABET.indexOf(character);
    if (index < 0) fail("BASE64");
    buffer = ((buffer << 6) | index) & 0xffff;
    bits += 6;
    if (bits >= 8) {
      bits -= 8;
      binary += String.fromCharCode((buffer >> bits) & 0xff);
    }
  }

  return binary;
}

/** Convert a binary (latin-1) string produced by base64 into UTF-8 text. */
function decodeUtf8(binary: string): string {
  let text = "";
  let offset = 0;

  while (offset < binary.length) {
    const first = binary.charCodeAt(offset) & 0xff;

    if (first < 0x80) {
      text += String.fromCharCode(first);
      offset += 1;
      continue;
    }

    let value: number;
    let trailing: number;

    if ((first & 0xe0) === 0xc0) {
      value = first & 0x1f;
      trailing = 1;
    } else if ((first & 0xf0) === 0xe0) {
      value = first & 0x0f;
      trailing = 2;
    } else if ((first & 0xf8) === 0xf0) {
      value = first & 0x07;
      trailing = 3;
    } else {
      return fail("BASE64");
    }

    if (offset + trailing >= binary.length) return fail("BASE64");

    for (let step = 1; step <= trailing; step += 1) {
      const byte = binary.charCodeAt(offset + step) & 0xff;
      if ((byte & 0xc0) !== 0x80) return fail("BASE64");
      value = (value << 6) | (byte & 0x3f);
    }

    text += String.fromCodePoint(value);
    offset += trailing + 1;
  }

  return text;
}

/** Decode one base64url segment into a JSON value. */
export function base64UrlToJson(part: string, decode: (value: string) => string): unknown {
  if (!part || !SEGMENT_PATTERN.test(part)) return fail("BASE64");

  const normalized = part.replace(/-/gu, "+").replace(/_/gu, "/");
  const remainder = normalized.length % 4;
  if (remainder === 1) return fail("BASE64");
  const padded = remainder === 0 ? normalized : normalized.padEnd(normalized.length + (4 - remainder), "=");

  let binary: string;
  try {
    binary = decode(padded);
  } catch {
    return fail("BASE64");
  }

  const json = decodeUtf8(binary);
  try {
    return JSON.parse(json) as unknown;
  } catch {
    return fail("JSON");
  }
}

const TIME_CLAIMS = ["exp", "iat", "nbf"] as const;
const TEXT_CLAIMS = ["sub", "iss", "jti", "name", "email"] as const;
const LIST_CLAIMS = ["aud", "scope"] as const;
const KNOWN_CLAIMS: ReadonlySet<string> = new Set<string>([...TIME_CLAIMS, ...TEXT_CLAIMS, ...LIST_CLAIMS]);

function stringify(value: unknown): string | null {
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (value && typeof value === "object") {
    try {
      return JSON.stringify(value) ?? null;
    } catch {
      return null;
    }
  }
  return null;
}

function toClaim(name: string, value: unknown): JwtClaim | null {
  if ((TIME_CLAIMS as readonly string[]).includes(name)) {
    if (typeof value !== "number" || !Number.isFinite(value)) return null;
    try {
      return { name, value: new Date(value * 1000).toISOString(), tone: "time" };
    } catch {
      const raw = stringify(value);
      return raw === null ? null : { name, value: raw, tone: "text" };
    }
  }

  if ((LIST_CLAIMS as readonly string[]).includes(name)) {
    if (Array.isArray(value)) {
      const items = value.map((item) => stringify(item)).filter((item): item is string => item !== null);
      return items.length ? { name, value: items.join(", "), tone: "list" } : null;
    }
    const raw = stringify(value);
    return raw === null ? null : { name, value: raw, tone: "list" };
  }

  const raw = stringify(value);
  return raw === null ? null : { name, value: raw, tone: "text" };
}

function collectClaims(payload: unknown): JwtClaim[] {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) return [];
  const record = payload as Record<string, unknown>;
  const claims: JwtClaim[] = [];

  for (const name of [...TIME_CLAIMS, ...TEXT_CLAIMS, ...LIST_CLAIMS]) {
    if (!Object.prototype.hasOwnProperty.call(record, name)) continue;
    const claim = toClaim(name, record[name]);
    if (claim) claims.push(claim);
  }

  for (const name of Object.keys(record)) {
    if (KNOWN_CLAIMS.has(name)) continue;
    const claim = toClaim(name, record[name]);
    if (claim) claims.push(claim);
  }

  return claims;
}

/**
 * Decode a compact JWT into its three segments and human-readable claims.
 * Signature verification is deliberately out of scope.
 */
export function decodeJwt(
  token: string,
  decode: (value: string) => string = defaultBase64Decode,
): JwtResult {
  const compact = token.trim();
  if (!compact) return { code: "FORMAT" };

  const parts = compact.split(".");
  if (
    parts.length !== 3 ||
    !parts[0] ||
    !parts[1] ||
    parts.some((part) => !SEGMENT_PATTERN.test(part))
  ) {
    return { code: "FORMAT" };
  }

  try {
    const header = base64UrlToJson(parts[0], decode);
    const payload = base64UrlToJson(parts[1], decode);

    return {
      header,
      payload,
      signature: parts[2],
      parts: { header: parts[0], payload: parts[1], signature: parts[2] },
      claims: collectClaims(payload),
      now: Date.now(),
    };
  } catch (error) {
    if (error instanceof DecoderFailure) return { code: error.code };
    return { code: "BASE64" };
  }
}
