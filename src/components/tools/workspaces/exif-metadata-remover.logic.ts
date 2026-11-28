/**
 * Pure metadata helpers for EXIF Metadata Remover. File reading, canvas
 * re-encoding and downloads live in exif-metadata-remover.tsx. This module
 * counts known metadata signatures only and never claims full EXIF parsing.
 */

export const MAX_FILE_BYTES = 20 * 1024 * 1024;

export const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
export type ImageFormat = (typeof ACCEPTED_TYPES)[number];

export interface FileFacts {
  name: string;
  type: string;
  sizeBytes: number;
  lastModified: number;
}

export interface ExifScan {
  /** Number of recognised EXIF signatures found in the raw bytes. */
  markers: number;
  bytesScanned: number;
}

const EXIF_SIGNATURE = [0x45, 0x78, 0x69, 0x66, 0x00, 0x00] as const; // "Exif\0\0"
const EXIF_CHUNK = [0x45, 0x58, 0x49, 0x46] as const; // "EXIF"
const PNG_EXIF_CHUNK = [0x65, 0x58, 0x49, 0x66] as const; // "eXIf"

function matches(bytes: Uint8Array, at: number, signature: readonly number[]): boolean {
  if (at < 0 || at + signature.length > bytes.length) return false;
  for (let index = 0; index < signature.length; index += 1) {
    if (bytes[at + index] !== signature[index]) return false;
  }
  return true;
}

/**
 * Count JPEG APP1 EXIF headers, PNG eXIf chunks and WebP EXIF chunks. This is
 * a lightweight byte signature count, not a full metadata parser.
 */
export function scanForExif(bytes: Uint8Array): ExifScan {
  let markers = 0;
  for (let index = 0; index + 5 < bytes.length; index += 1) {
    if (bytes[index] === 0xff && bytes[index + 1] === 0xe1 && matches(bytes, index + 4, EXIF_SIGNATURE)) {
      markers += 1;
    }
    if (matches(bytes, index, EXIF_CHUNK) || matches(bytes, index, PNG_EXIF_CHUNK)) {
      markers += 1;
    }
  }
  return { markers, bytesScanned: bytes.length };
}

export function isAcceptedType(type: string): boolean {
  return (ACCEPTED_TYPES as readonly string[]).includes(type);
}

export function extensionForFormat(format: ImageFormat): string {
  if (format === "image/jpeg") return "jpg";
  if (format === "image/webp") return "webp";
  return "png";
}

export function parseFileName(name: string): { base: string; ext: string } {
  const dot = name.lastIndexOf(".");
  if (dot <= 0) return { base: name, ext: "" };
  return { base: name.slice(0, dot), ext: name.slice(dot).toLowerCase() };
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

/** An ISO style date string from a file's last modified timestamp. */
export function formatModified(timestamp: number): string {
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toISOString().slice(0, 19).replace("T", " ");
}

export function sizeChange(before: number, after: number): { savedBytes: number; percent: number } {
  const savedBytes = before - after;
  const percent = before > 0 ? Math.round((Math.abs(savedBytes) / before) * 100) : 0;
  return { savedBytes, percent };
}
