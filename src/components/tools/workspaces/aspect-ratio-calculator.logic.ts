/** Pure ratio maths. No DOM, no React, no translated strings. */

export type Ratio = { w: number; h: number };
export type Dimensions = { width: number; height: number };
export type RoundingMode = "nearest" | "up" | "down";
export type RatioErrorCode = "NON_POSITIVE_DIMENSION" | "MISSING_TARGET";

export class RatioError extends Error {
  readonly code: RatioErrorCode;

  constructor(code: RatioErrorCode) {
    super(code);
    this.name = "RatioError";
    this.code = code;
  }
}

function assertPositive(value: number): void {
  if (!Number.isFinite(value) || value <= 0) {
    throw new RatioError("NON_POSITIVE_DIMENSION");
  }
}

function gcd(a: number, b: number): number {
  let x = Math.abs(a);
  let y = Math.abs(b);
  while (y !== 0) {
    const remainder = x % y;
    x = y;
    y = remainder;
  }
  return x === 0 ? 1 : x;
}

function isNearlyInteger(value: number): boolean {
  return Math.abs(value - Math.round(value)) < 1e-9;
}

/** Convert a possibly decimal pair to integers before cancelling common factors. */
function toIntegerRatio(w: number, h: number): Ratio {
  let scale = 1;
  for (let step = 0; step < 9; step += 1) {
    if (isNearlyInteger(w * scale) && isNearlyInteger(h * scale)) break;
    scale *= 10;
  }

  const wholeW = Math.round(w * scale);
  const wholeH = Math.round(h * scale);
  const divisor = gcd(wholeW, wholeH);
  return { w: wholeW / divisor, h: wholeH / divisor };
}

/** Reduce a width/height pair to its simplest whole-number ratio. */
export function reduceRatio(width: number, height: number): Ratio {
  assertPositive(width);
  assertPositive(height);
  return toIntegerRatio(width, height);
}

function roundValue(value: number, mode: RoundingMode): number {
  const tolerance = 1e-9 * Math.max(1, Math.abs(value));
  if (mode === "up") return Math.ceil(value - tolerance);
  if (mode === "down") return Math.floor(value + tolerance);
  return Math.round(value);
}

/**
 * Scale a source size from one locked edge. The other edge is derived from the
 * original ratio and rounded with the chosen mode. Width wins if both targets
 * are supplied, which keeps the function deterministic.
 */
export function scaleDimensions(
  width: number,
  height: number,
  target: { width?: number; height?: number },
  mode: RoundingMode = "nearest",
): Dimensions {
  assertPositive(width);
  assertPositive(height);

  const hasWidth = target.width !== undefined;
  const hasHeight = target.height !== undefined;
  if (!hasWidth && !hasHeight) {
    throw new RatioError("MISSING_TARGET");
  }

  if (hasWidth) {
    const locked = roundValue(target.width as number, mode);
    assertPositive(locked);
    const derived = roundValue((locked * height) / width, mode);
    assertPositive(derived);
    return { width: locked, height: derived };
  }

  const locked = roundValue(target.height as number, mode);
  assertPositive(locked);
  const derived = roundValue((locked * width) / height, mode);
  assertPositive(derived);
  return { width: derived, height: locked };
}

/** Accept 16:9, 16/9, 16 x 9 and decimal forms such as 1.78. */
export function parseRatio(input: string): Ratio | null {
  const value = input.trim();
  if (!value) return null;

  const pair = value.match(/^(\d+(?:\.\d+)?)\s*(?::|\/|x|×)\s*(\d+(?:\.\d+)?)$/iu);
  if (pair) {
    const w = Number(pair[1]);
    const h = Number(pair[2]);
    if (!Number.isFinite(w) || !Number.isFinite(h) || w <= 0 || h <= 0) return null;
    if (w > Number.MAX_SAFE_INTEGER / 1e6 || h > Number.MAX_SAFE_INTEGER / 1e6) return null;
    return { w, h };
  }

  const decimal = value.match(/^(\d+(?:\.\d+)?)$/u);
  if (!decimal) return null;

  const w = Number(decimal[1]);
  if (!Number.isFinite(w) || w <= 0 || w > Number.MAX_SAFE_INTEGER / 1e6) return null;
  return { w, h: 1 };
}

export const commonRatios: readonly Ratio[] = [
  { w: 1, h: 1 },
  { w: 4, h: 3 },
  { w: 3, h: 2 },
  { w: 16, h: 9 },
  { w: 21, h: 9 },
  { w: 9, h: 16 },
];
