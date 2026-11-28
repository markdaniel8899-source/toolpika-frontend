/**
 * Pure geometry and naming helpers for Image Cropper. All DOM work (canvas,
 * files, object URLs and pointer events) lives in image-cropper.tsx.
 */

export const MAX_FILE_BYTES = 20 * 1024 * 1024;
/** Canvas sides above this are unreliable across browsers and devices. */
export const MAX_CANVAS_SIDE = 8192;

export const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
export type ImageFormat = (typeof ACCEPTED_TYPES)[number];

export const ASPECT_PRESETS = ["free", "1:1", "4:3", "16:9", "3:4"] as const;
export type AspectPreset = (typeof ASPECT_PRESETS)[number];

export interface CropBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface SourceSize {
  width: number;
  height: number;
}

const RATIOS: Record<AspectPreset, number | null> = {
  free: null,
  "1:1": 1,
  "4:3": 4 / 3,
  "16:9": 16 / 9,
  "3:4": 3 / 4,
};

/** The width-to-height ratio for a preset, or null for a free crop. */
export function aspectRatio(preset: AspectPreset): number | null {
  return RATIOS[preset];
}

export function clamp(value: number, min: number, max: number): number {
  if (max < min) return min;
  return Math.min(max, Math.max(min, value));
}

function safeSize(size: SourceSize): SourceSize {
  return {
    width: Math.max(1, Math.floor(size.width)),
    height: Math.max(1, Math.floor(size.height)),
  };
}

/**
 * Keep a crop box inside the source and honour a locked aspect ratio. With a
 * ratio, width is authoritative and height is derived from it before clipping.
 */
export function normalizeCropBox(
  box: CropBox,
  size: SourceSize,
  preset: AspectPreset,
): CropBox {
  const source = safeSize(size);
  let width = clamp(Math.round(box.width), 1, source.width);
  let height = clamp(Math.round(box.height), 1, source.height);
  const ratio = RATIOS[preset];

  if (ratio) {
    height = clamp(Math.round(width / ratio), 1, source.height);
    width = clamp(Math.round(height * ratio), 1, source.width);
  }

  return {
    x: clamp(Math.round(box.x), 0, source.width - width),
    y: clamp(Math.round(box.y), 0, source.height - height),
    width,
    height,
  };
}

/** Start with the largest box that fits the source and the chosen ratio. */
export function initialCropBox(size: SourceSize, preset: AspectPreset): CropBox {
  const source = safeSize(size);
  const ratio = RATIOS[preset];
  const width = ratio
    ? Math.min(source.width, Math.round(source.height * ratio))
    : source.width;
  const height = ratio
    ? Math.min(source.height, Math.round(width / ratio))
    : source.height;
  return normalizeCropBox({ x: 0, y: 0, width, height }, source, preset);
}

/** Change preset while keeping the box centered and inside the source. */
export function cropForPreset(
  box: CropBox,
  size: SourceSize,
  preset: AspectPreset,
): CropBox {
  const source = safeSize(size);
  const ratio = RATIOS[preset];
  if (!ratio) return normalizeCropBox(box, source, preset);

  const centerX = box.x + box.width / 2;
  const centerY = box.y + box.height / 2;
  const width = Math.max(
    1,
    Math.min(box.width, source.width, Math.round(source.height * ratio)),
  );
  const height = Math.max(1, Math.min(Math.round(width / ratio), source.height));
  return normalizeCropBox(
    {
      x: Math.round(centerX - width / 2),
      y: Math.round(centerY - height / 2),
      width,
      height,
    },
    source,
    preset,
  );
}

/** Percentage offsets used to draw the crop overlay over the preview. */
export function cropBoxPercent(
  box: CropBox,
  size: SourceSize,
): { left: number; top: number; width: number; height: number } {
  const source = safeSize(size);
  return {
    left: (box.x / source.width) * 100,
    top: (box.y / source.height) * 100,
    width: (box.width / source.width) * 100,
    height: (box.height / source.height) * 100,
  };
}

/** Dimensions of the exported image, before any device pixel scaling. */
export function outputSize(box: CropBox): SourceSize {
  return { width: Math.max(1, Math.round(box.width)), height: Math.max(1, Math.round(box.height)) };
}

export function extensionForFormat(format: ImageFormat): string {
  if (format === "image/jpeg") return "jpg";
  if (format === "image/webp") return "webp";
  return "png";
}

export function isAcceptedType(type: string): boolean {
  return (ACCEPTED_TYPES as readonly string[]).includes(type);
}

/** Split a file name into its base and lowercase extension. */
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
