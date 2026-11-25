/**
 * Pure helpers for Image Resizer. All DOM work (ImageBitmap, canvas, object
 * URLs) lives in image-resizer.tsx so these functions stay testable.
 */

export const MAX_FILE_BYTES = 20 * 1024 * 1024;
/** Canvas dimensions above this are unreliable across browsers and devices. */
export const MAX_CANVAS_SIDE = 8192;

export const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;

export type ImageFormat = (typeof ACCEPTED_TYPES)[number];
export type AspectLock = "width" | "height" | "auto";

export interface Size {
  width: number;
  height: number;
}

/** Split a file name into its base and lowercase extension. */
export function parseFileName(name: string): { base: string; ext: string } {
  const dot = name.lastIndexOf(".");
  if (dot <= 0) return { base: name, ext: "" };
  return { base: name.slice(0, dot), ext: name.slice(dot).toLowerCase() };
}

/** File extension used by the downloaded image for each encoder. */
export function extensionForFormat(format: ImageFormat): string {
  if (format === "image/jpeg") return "jpg";
  if (format === "image/webp") return "webp";
  return "png";
}

function positive(value: number | undefined): number | undefined {
  return typeof value === "number" && Number.isFinite(value) && value > 0
    ? value
    : undefined;
}

/**
 * Compute integer output dimensions that preserve the source aspect ratio.
 * "width" and "height" treat that single field as authoritative; "auto"
 * fits inside both supplied bounds without stretching the image.
 */
export function fitWithin(
  sourceW: number,
  sourceH: number,
  targetW?: number,
  targetH?: number,
  lock: AspectLock = "auto",
): Size {
  const sw = Math.max(1, Math.floor(sourceW));
  const sh = Math.max(1, Math.floor(sourceH));
  const ratio = sw / sh;
  const width = positive(targetW);
  const height = positive(targetH);

  const safeWidth = (value: number) => Math.max(1, Math.round(value));

  if (lock === "width") {
    const w = width ?? (height ? height * ratio : sw);
    return { width: safeWidth(w), height: safeWidth(w / ratio) };
  }

  if (lock === "height") {
    const h = height ?? (width ? width / ratio : sh);
    return { width: safeWidth(h * ratio), height: safeWidth(h) };
  }

  if (!width && !height) return { width: sw, height: sh };

  if (width && !height) {
    return { width: safeWidth(width), height: safeWidth(width / ratio) };
  }

  if (!width && height) {
    return { width: safeWidth(height * ratio), height: safeWidth(height) };
  }

  if (width && height) {
    const boundedWidth = Math.min(width, height * ratio);
    const boundedHeight = Math.min(height, boundedWidth / ratio);
    return { width: safeWidth(boundedWidth), height: safeWidth(boundedHeight) };
  }

  return { width: sw, height: sh };
}

/** Human-readable byte count for the input and output stats. */
export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}
