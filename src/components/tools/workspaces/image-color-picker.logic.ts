/**
 * Pure colour maths for Image Color Picker. Canvas sampling and file handling
 * stay in image-color-picker.tsx; these functions only work on numbers and
 * typed arrays.
 */

export const MAX_FILE_BYTES = 20 * 1024 * 1024;
export const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
export const DEFAULT_PALETTE_SIZE = 6;
export const MIN_PALETTE_SIZE = 3;
export const MAX_PALETTE_SIZE = 12;
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

export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes < 0) return "0 B";
  if (bytes < 1024) return `${Math.round(bytes)} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
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

interface Sample {
  r: number;
  g: number;
  b: number;
}

function distance(a: Sample, b: Sample): number {
  return Math.hypot(a.r - b.r, a.g - b.g, a.b - b.b);
}

/**
 * Extract a real palette from sampled pixels using k-means. Transparent pixels
 * are ignored, near duplicate centres are merged and clusters are ranked by
 * the share of pixels they represent.
 */
export function quantizePalette(
  data: Uint8ClampedArray,
  count: number,
): PaletteSwatch[] {
  const pixels: Sample[] = [];
  for (let index = 0; index < data.length; index += 4 * PIXEL_STRIDE) {
    if (data[index + 3] < 128) continue;
    pixels.push({ r: data[index], g: data[index + 1], b: data[index + 2] });
  }
  if (pixels.length === 0) return [];

  const wanted = Math.max(1, Math.min(12, Math.round(count)));
  const unique = new Map<string, { color: Sample; count: number }>();
  for (const pixel of pixels) {
    const key = `${pixel.r},${pixel.g},${pixel.b}`;
    const found = unique.get(key);
    if (found) found.count += 1;
    else unique.set(key, { color: pixel, count: 1 });
  }

  const ranked = [...unique.values()].sort((a, b) => b.count - a.count);
  const centers: Sample[] = [];
  for (const item of ranked) {
    if (centers.length >= wanted) break;
    if (centers.every((center) => distance(center, item.color) > 28)) {
      centers.push({ ...item.color });
    }
  }
  for (const item of ranked) {
    if (centers.length >= wanted) break;
    centers.push({ ...item.color });
  }

  const assigned = new Array<number>(pixels.length).fill(0);
  for (let step = 0; step < 10; step += 1) {
    for (let index = 0; index < pixels.length; index += 1) {
      let best = 0;
      let bestDistance = Number.POSITIVE_INFINITY;
      for (let center = 0; center < centers.length; center += 1) {
        const value = distance(pixels[index], centers[center]);
        if (value < bestDistance) {
          bestDistance = value;
          best = center;
        }
      }
      assigned[index] = best;
    }
    for (let center = 0; center < centers.length; center += 1) {
      let r = 0;
      let g = 0;
      let b = 0;
      let total = 0;
      for (let index = 0; index < pixels.length; index += 1) {
        if (assigned[index] !== center) continue;
        r += pixels[index].r;
        g += pixels[index].g;
        b += pixels[index].b;
        total += 1;
      }
      if (total > 0) centers[center] = { r: r / total, g: g / total, b: b / total };
    }
  }

  const totals = new Array<number>(centers.length).fill(0);
  for (const owner of assigned) totals[owner] += 1;

  const swatches: PaletteSwatch[] = centers
    .map((center, index) => ({
      center,
      total: totals[index],
    }))
    .filter((item) => item.total > 0)
    .sort((a, b) => b.total - a.total)
    .map((item) => {
      const rgb: Rgb = {
        r: clampByte(item.center.r),
        g: clampByte(item.center.g),
        b: clampByte(item.center.b),
      };
      return {
        hex: rgbToHex(rgb),
        rgb,
        hsl: rgbToHsl(rgb),
        share: Math.round((item.total / pixels.length) * 100),
      };
    });

  const deduped: PaletteSwatch[] = [];
  for (const swatch of swatches) {
    if (deduped.every((other) => distance(swatch.rgb, other.rgb) > 12)) deduped.push(swatch);
  }
  return deduped.slice(0, wanted);
}

/** A CSS custom property block ready to paste into a stylesheet. */
export function cssVariables(palette: PaletteSwatch[]): string {
  if (palette.length === 0) return "";
  const lines = palette.map((swatch, index) => `  --color-${index + 1}: ${swatch.hex};`);
  return [":root {", ...lines, "}"].join("\n");
}
