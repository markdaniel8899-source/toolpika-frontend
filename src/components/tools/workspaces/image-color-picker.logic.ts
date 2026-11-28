/**
 * Pure colour maths for Image Color Picker. Canvas sampling and file handling
 * stay in image-color-picker.tsx; these functions only work on numbers and
 * typed arrays.
 */

export const MAX_FILE_BYTES = 20 * 1024 * 1024;
export const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
export const DEFAULT_PALETTE_SIZE = 6;
export const MIN_PALETTE_SIZE = 3;
export const MAX_PALETTE_SIZE = 10;
/** Skip every other pixel when quantizing large images. */
export const PIXEL_STRIDE = 2;

export interface Rgb {
  r: number;
  g: number;
  b: number;
}

export interface Hsl {
  h: number;
  s: number;
  l: number;
}

export interface PaletteSwatch {
  hex: string;
  rgb: Rgb;
  hsl: Hsl;
  share: number;
}

export function isAcceptedType(type: string): boolean {
  return (ACCEPTED_TYPES as readonly string[]).includes(type);
}

export function clampByte(value: number): number {
  return Math.max(0, Math.min(255, Math.round(value)));
}

export function rgbToHex(rgb: Rgb): string {
  const part = (value: number) => clampByte(value).toString(16).padStart(2, "0");
  return `#${part(rgb.r)}${part(rgb.g)}${part(rgb.b)}`.toUpperCase();
}

export function rgbToHsl(rgb: Rgb): Hsl {
  const r = clampByte(rgb.r) / 255;
  const g = clampByte(rgb.g) / 255;
  const b = clampByte(rgb.b) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;
  const l = (max + min) / 2;

  if (delta === 0) return { h: 0, s: 0, l: Math.round(l * 100) };

  const s = delta / (1 - Math.abs(2 * l - 1));
  let h = 0;
  if (max === r) h = ((g - b) / delta) % 6;
  else if (max === g) h = (b - r) / delta + 2;
  else h = (r - g) / delta + 4;
  h = (h * 60 + 360) % 360;

  return { h: Math.round(h), s: Math.round(s * 100), l: Math.round(l * 100) };
}

export function formatRgb(rgb: Rgb): string {
  return `rgb(${clampByte(rgb.r)}, ${clampByte(rgb.g)}, ${clampByte(rgb.b)})`;
}

export function formatHsl(hsl: Hsl): string {
  return `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`;
}

interface Bucket {
  r: number;
  g: number;
  b: number;
  count: number;
}

/**
 * Quantize sampled pixels into colour buckets and return the most common ones
 * with their share of the sampled pixels. Fully transparent pixels are skipped.
 */
export function quantizePalette(
  data: Uint8ClampedArray,
  count: number,
  bucketSize = 32,
): PaletteSwatch[] {
  const buckets = new Map<number, Bucket>();
  let sampled = 0;

  for (let index = 0; index < data.length; index += 4 * PIXEL_STRIDE) {
    const alpha = data[index + 3];
    if (alpha < 128) continue;
    const r = data[index];
    const g = data[index + 1];
    const b = data[index + 2];
    const key =
      (Math.floor(r / bucketSize) << 16) |
      (Math.floor(g / bucketSize) << 8) |
      Math.floor(b / bucketSize);
    const bucket = buckets.get(key) ?? { r: 0, g: 0, b: 0, count: 0 };
    bucket.r += r;
    bucket.g += g;
    bucket.b += b;
    bucket.count += 1;
    buckets.set(key, bucket);
    sampled += 1;
  }

  if (sampled === 0) return [];

  const ranked = Array.from(buckets.values()).sort((a, b) => b.count - a.count);
  return ranked.slice(0, Math.max(1, count)).map((bucket) => {
    const rgb: Rgb = {
      r: clampByte(bucket.r / bucket.count),
      g: clampByte(bucket.g / bucket.count),
      b: clampByte(bucket.b / bucket.count),
    };
    return {
      hex: rgbToHex(rgb),
      rgb,
      hsl: rgbToHsl(rgb),
      share: Math.round((bucket.count / sampled) * 100),
    };
  });
}

/** A CSS custom property block ready to paste into a stylesheet. */
export function cssVariables(palette: PaletteSwatch[]): string {
  if (palette.length === 0) return "";
  const lines = palette.map((swatch, index) => `  --color-${index + 1}: ${swatch.hex};`);
  return [":root {", ...lines, "}"].join("\n");
}
