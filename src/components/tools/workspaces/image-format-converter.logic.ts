/** Pure helpers for the image format converter. No DOM, React or network calls. */

export type OutputFormat = "image/webp" | "image/jpeg" | "image/png" | "image/avif";

export const INPUT_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif", "image/bmp"] as const;

export const FORMATS: readonly OutputFormat[] = [
  "image/webp",
  "image/jpeg",
  "image/png",
  "image/avif",
];

/** Lossy formats use a quality value; PNG ignores it entirely. */
export function isLossy(format: OutputFormat): boolean {
  return format !== "image/png";
}

export function extensionFor(format: OutputFormat): string {
  if (format === "image/jpeg") return "jpg";
  return format.slice("image/".length);
}

export function outputFileName(sourceName: string, format: OutputFormat): string {
  const base = sourceName.replace(/\.[^.]+$/u, "") || "image";
  return `${base}-converted.${extensionFor(format)}`;
}

/** Human readable byte size with stable units. */
export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes < 0) return "0 B";
  if (bytes < 1024) return `${Math.round(bytes)} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export interface SizeDelta {
  bytes: number;
  percent: number;
}

/** Positive means the output grew; negative means it shrank. */
export function sizeDelta(originalBytes: number, convertedBytes: number): SizeDelta {
  if (originalBytes <= 0) return { bytes: 0, percent: 0 };
  const bytes = convertedBytes - originalBytes;
  return { bytes, percent: (bytes / originalBytes) * 100 };
}

export function formatDelta(delta: SizeDelta): string {
  const sign = delta.bytes > 0 ? "+" : delta.bytes < 0 ? "−" : "";
  return `${sign}${formatBytes(Math.abs(delta.bytes))} (${sign}${Math.abs(delta.percent).toFixed(1)}%)`;
}

export function clampQuality(value: number): number {
  if (!Number.isFinite(value)) return 80;
  return Math.min(100, Math.max(1, Math.round(value)));
}

export function isAcceptedType(type: string): boolean {
  return (INPUT_TYPES as readonly string[]).includes(type.toLowerCase());
}

export const MAX_FILE_BYTES = 25 * 1024 * 1024;
