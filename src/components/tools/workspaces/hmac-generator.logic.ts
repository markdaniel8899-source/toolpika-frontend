/**
 * Pure HMAC helpers. No React, no DOM, no network access.
 * Tags are computed locally with the Web Crypto API; the message and secret
 * never leave the browser tab.
 */

export type HmacAlgorithm = "SHA-1" | "SHA-256" | "SHA-512";

/** Codes the UI maps to friendly, translated messages. */
export type HmacErrorCode = "unsupported" | "insecure" | "tooLarge" | "failed";

/** Keep large inputs out of the main thread's signing step. */
export const MAX_TEXT_CHARS = 100000;

export const DIGEST_BITS: Record<HmacAlgorithm, number> = {
  "SHA-1": 160,
  "SHA-256": 256,
  "SHA-512": 512,
};

/** Typed failure carrying a code instead of a raw platform exception. */
export class HmacError extends Error {
  readonly code: HmacErrorCode;

  constructor(code: HmacErrorCode) {
    super(code);
    this.name = "HmacError";
    this.code = code;
  }
}

export function hmacErrorCode(error: unknown): HmacErrorCode {
  return error instanceof HmacError ? error.code : "failed";
}

/**
 * Web Crypto's subtle API is only exposed in secure contexts (HTTPS or
 * localhost). Detect that before signing so the UI can explain the problem.
 */
export function cryptoSupport():
  | { ok: true; subtle: SubtleCrypto }
  | { ok: false; code: "unsupported" | "insecure" } {
  const scope = globalThis as typeof globalThis & { isSecureContext?: boolean };

  if (scope.isSecureContext === false) {
    return { ok: false, code: "insecure" };
  }

  const subtle = scope.crypto?.subtle;
  if (
    !subtle ||
    typeof subtle.importKey !== "function" ||
    typeof subtle.sign !== "function"
  ) {
    return { ok: false, code: "unsupported" };
  }

  return { ok: true, subtle };
}

/** Lowercase hexadecimal representation of an ArrayBuffer. */
export function toHex(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let hex = "";
  for (let i = 0; i < bytes.length; i += 1) {
    hex += bytes[i].toString(16).padStart(2, "0");
  }
  return hex;
}

/**
 * Compute a keyed HMAC tag over UTF-8 encoded text. The secret is imported as
 * raw key bytes and is never persisted, transmitted or logged.
 */
export async function hmacDigest(
  message: string,
  secret: string,
  algorithm: HmacAlgorithm,
): Promise<string> {
  if (message.length > MAX_TEXT_CHARS || secret.length > MAX_TEXT_CHARS) {
    throw new HmacError("tooLarge");
  }

  const support = cryptoSupport();
  if (!support.ok) throw new HmacError(support.code);

  const encoder = new TextEncoder();
  const key = await support.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: algorithm },
    false,
    ["sign"],
  );
  const signature = await support.subtle.sign("HMAC", key, encoder.encode(message));
  return toHex(signature);
}

/** Apply the display-only casing switch without recomputing the tag. */
export function applyCasing(digest: string, uppercase: boolean): string {
  return uppercase ? digest.toUpperCase() : digest;
}
