/** Pure pixels per inch maths. No DOM, no React, no translated strings. */

export interface PpiInput {
  width: number;
  height: number;
  diagonalInches: number;
}

export interface Ratio {
  w: number;
  h: number;
}

export interface Size {
  width: number;
  height: number;
}

export type PpiErrorCode = "invalidNumber" | "nonPositive";

export type PpiCalculation =
  | {
      ok: true;
      ppi: number;
      diagonalPixels: number;
      megapixels: number;
      ratio: Ratio;
    }
  | {
      ok: false;
      code: PpiErrorCode;
    };

export const PPI_DEFAULTS: PpiInput = {
  width: 1920,
  height: 1080,
  diagonalInches: 24,
};

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

/** Reduce a pixel pair to whole numbers with no common factor. */
export function reduceRatio(width: number, height: number): Ratio {
  const divisor = gcd(Math.round(width), Math.round(height));
  return { w: Math.round(width) / divisor, h: Math.round(height) / divisor };
}

/** Scale a rectangle to fit the preview stage while keeping its proportions. */
export function previewSize(
  width: number,
  height: number,
  maxWidth = 440,
  maxHeight = 260,
): Size {
  const scale = Math.min(maxWidth / width, maxHeight / height);
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  };
}

/** PPI is the pixel diagonal divided by the physical diagonal in inches. */
export function calculatePpi(input: PpiInput): PpiCalculation {
  const values = [input.width, input.height, input.diagonalInches];
  if (values.some((value) => !Number.isFinite(value))) {
    return { ok: false, code: "invalidNumber" };
  }
  if (values.some((value) => value <= 0)) {
    return { ok: false, code: "nonPositive" };
  }

  const diagonalPixels = Math.hypot(input.width, input.height);
  return {
    ok: true,
    ppi: diagonalPixels / input.diagonalInches,
    diagonalPixels,
    megapixels: (input.width * input.height) / 1_000_000,
    ratio: reduceRatio(input.width, input.height),
  };
}
