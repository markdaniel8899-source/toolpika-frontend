/**
 * Pure string helpers for Image to Base64. File reading, clipboard access and
 * image preview happen inside image-to-base64.tsx.
 */

export const MAX_FILE_BYTES = 20 * 1024 * 1024;
/** Data URLs above this are unwieldy in stylesheets and HTML source. */
export const SIZE_WARNING_BYTES = 1.5 * 1024 * 1024;

export const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"] as const;
export type ImageMime = (typeof ACCEPTED_TYPES)[number];

export interface ParsedDataUrl {
  mime: string;
  base64: string;
}

/** Map a browser file type to one of the supported image MIME strings. */
export function mimeFromType(type: string): ImageMime | null {
  const lower = type.trim().toLowerCase();
  return (ACCEPTED_TYPES as readonly string[]).includes(lower)
    ? (lower as ImageMime)
    : null;
}

export function extensionForMime(mime: string): string {
  if (mime === "image/jpeg") return "jpg";
  if (mime === "image/webp") return "webp";
  if (mime === "image/gif") return "gif";
  return "png";
}

/** Assemble a Data URL from its two parts without touching the DOM. */
export function buildDataUrl(mime: string, base64: string): string {
  const clean = base64.replace(/\s/gu, "");
  return `data:${mime};base64,${clean}`;
}

/** A copy-ready CSS declaration for the generated Data URL. */
export function cssSnippet(dataUrl: string): string {
  return `background-image: url("${dataUrl}");`;
}

/** A copy-ready HTML element for the generated Data URL. */
export function htmlSnippet(dataUrl: string, alt: string): string {
  const safeAlt = alt.replace(/"/gu, "&quot;");
  return `<img src="${dataUrl}" alt="${safeAlt}" />`;
}

/**
 * Validate and split a pasted image Data URL. Whitespace inside the base64
 * payload is ignored so wrapped snippets can be pasted back in.
 */
export function parseDataUrl(value: string): ParsedDataUrl | null {
  const match = /^data:(image\/[a-z0-9.+-]+);base64,([a-z0-9+/=\s]+)$/iu.exec(value.trim());
  if (!match) return null;
  const base64 = match[2].replace(/\s/gu, "");
  if (base64.length === 0 || base64.length % 4 !== 0) return null;
  return { mime: match[1].toLowerCase(), base64 };
}

/** Estimate decoded bytes from a base64 length, accounting for padding. */
export function estimateDecodedBytes(base64: string): number {
  const clean = base64.replace(/\s/gu, "");
  const padding = clean.endsWith("==") ? 2 : clean.endsWith("=") ? 1 : 0;
  return Math.max(0, Math.floor((clean.length * 3) / 4) - padding);
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export function parseFileName(name: string): { base: string; ext: string } {
  const dot = name.lastIndexOf(".");
  if (dot <= 0) return { base: name, ext: "" };
  return { base: name.slice(0, dot), ext: name.slice(dot).toLowerCase() };
}

/** A readable alt fallback from a local file name. */
export function altFromFileName(name: string, fallback: string): string {
  const base = parseFileName(name).base.replace(/[-_]+/gu, " ").trim();
  return base || fallback;
}
