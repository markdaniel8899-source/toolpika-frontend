/**
 * Pure hashing helpers. No React, no DOM, no network access.
 * Every digest is computed locally with the Web Crypto API.
 */

export type HashAlgorithm = "SHA-1" | "SHA-256" | "SHA-512";

/** Codes the UI maps to friendly, translated messages. */
export type HashErrorCode =
  | "unsupported"
  | "insecure"
  | "textTooLarge"
  | "fileTooLarge"
  | "failed";

export const MAX_TEXT_CHARS = 1000000;
export const MAX_FILE_BYTES = 20 * 1024 * 1024;

export const DIGEST_BITS: Record<HashAlgorithm, number> = {
  "SHA-1": 160,
  "SHA-256": 256,
  "SHA-512": 512,
};

/** Typed failure carrying a code instead of a raw platform exception. */
export class HashError extends Error {
  readonly code: HashErrorCode;

  constructor(code: HashErrorCode) {
    super(code);
    this.name = "HashError";
    this.code = code;
  }
}

export function hashErrorCode(error: unknown): HashErrorCode {
  return error instanceof HashError ? error.code : "failed";
}

/**
 * Web Crypto's subtle.digest is only exposed in secure contexts (HTTPS or
 * localhost). Detect that before attempting a hash so the UI can explain it.
 */
export function cryptoSupport():
  | { ok: true; subtle: SubtleCrypto }
  | { ok: false; code: "unsupported" | "insecure" } {
  const scope = globalThis as typeof globalThis & { isSecureContext?: boolean };

  if (scope.isSecureContext === false) {
    return { ok: false, code: "insecure" };
  }

  const subtle = scope.crypto?.subtle;
  if (!subtle || typeof subtle.digest !== "function") {
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

/** Hash UTF-8 encoded text. Empty text still produces a valid digest. */
export async function hashText(text: string, algorithm: HashAlgorithm): Promise<string> {
  if (text.length > MAX_TEXT_CHARS) throw new HashError("textTooLarge");

  const support = cryptoSupport();
  if (!support.ok) throw new HashError(support.code);

  const data = new TextEncoder().encode(text);
  const digest = await support.subtle.digest(algorithm, data);
  return toHex(digest);
}

/** Hash the raw bytes of a Blob or File without uploading it. */
export async function hashFile(file: Blob, algorithm: HashAlgorithm): Promise<string> {
  if (file.size > MAX_FILE_BYTES) throw new HashError("fileTooLarge");

  const support = cryptoSupport();
  if (!support.ok) throw new HashError(support.code);

  const data = await file.arrayBuffer();
  const digest = await support.subtle.digest(algorithm, data);
  return toHex(digest);
}

/** Small helper for showing a chosen file's size. */
export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}
