/** Pure bidirectional Roman numeral conversion for the range 1 to 3999. */

export type RomanDirection = "number" | "roman";

export type RomanErrorCode =
  | "empty"
  | "invalidChars"
  | "notInteger"
  | "outOfRange"
  | "tooManyRepeats"
  | "badOrder";

export type RomanConversion =
  | {
      ok: true;
      direction: RomanDirection;
      numeral: string;
      value: number;
    }
  | {
      ok: false;
      direction: RomanDirection | null;
      code: RomanErrorCode;
    };

export const MIN_VALUE = 1;
export const MAX_VALUE = 3999;

const ROMAN_TABLE: ReadonlyArray<readonly [number, string]> = [
  [1000, "M"],
  [900, "CM"],
  [500, "D"],
  [400, "CD"],
  [100, "C"],
  [90, "XC"],
  [50, "L"],
  [40, "XL"],
  [10, "X"],
  [9, "IX"],
  [5, "V"],
  [4, "IV"],
  [1, "I"],
];

const VALUE_TABLE: Readonly<Record<string, number>> = {
  I: 1,
  V: 5,
  X: 10,
  L: 50,
  C: 100,
  D: 500,
  M: 1000,
};

export const ROMAN_EXAMPLES: ReadonlyArray<{ value: number; numeral: string }> = [
  { value: 1, numeral: "I" },
  { value: 4, numeral: "IV" },
  { value: 9, numeral: "IX" },
  { value: 40, numeral: "XL" },
  { value: 90, numeral: "XC" },
  { value: 400, numeral: "CD" },
  { value: 900, numeral: "CM" },
  { value: 1994, numeral: "MCMXCIV" },
];

export function detectDirection(input: string): RomanDirection | null {
  const value = input.trim();
  if (/^\d+$/u.test(value)) return "number";
  if (/^[ivxlcdm]+$/iu.test(value)) return "roman";
  return null;
}

/** Build the canonical subtractive form of an integer in the supported range. */
export function toRoman(value: number): string | null {
  if (!Number.isInteger(value) || value < MIN_VALUE || value > MAX_VALUE) return null;
  let remaining = value;
  let output = "";
  for (const [amount, symbol] of ROMAN_TABLE) {
    while (remaining >= amount) {
      output += symbol;
      remaining -= amount;
    }
  }
  return output;
}

/** Read a Roman string back into an integer using subtractive notation. */
export function fromRoman(input: string): number | null {
  const normalized = input.trim().toUpperCase();
  if (!normalized || !/^[IVXLCDM]+$/u.test(normalized)) return null;

  let total = 0;
  for (let index = 0; index < normalized.length; index += 1) {
    const current = VALUE_TABLE[normalized[index]];
    const next = VALUE_TABLE[normalized[index + 1]];
    if (next !== undefined && current < next) {
      total -= current;
    } else {
      total += current;
    }
  }
  return total >= MIN_VALUE && total <= MAX_VALUE ? total : null;
}

function hasLongRun(input: string): boolean {
  return /([IVXLCDM])\1{3,}/u.test(input.toUpperCase());
}

/**
 * Convert either direction from one input string. Errors carry a code so the
 * interface can show an exact error sentence and its matching fix hint.
 */
export function convertRoman(input: string): RomanConversion {
  const direction = detectDirection(input);
  if (!input.trim()) {
    return { ok: false, direction: null, code: "empty" };
  }
  if (!direction) {
    return { ok: false, direction: null, code: "invalidChars" };
  }

  if (direction === "number") {
    const value = Number(input.trim());
    if (!Number.isFinite(value) || !Number.isInteger(value)) {
      return { ok: false, direction, code: "notInteger" };
    }
    if (value < MIN_VALUE || value > MAX_VALUE) {
      return { ok: false, direction, code: "outOfRange" };
    }
    const numeral = toRoman(value);
    if (!numeral) {
      return { ok: false, direction, code: "outOfRange" };
    }
    return { ok: true, direction, numeral, value };
  }

  const normalized = input.trim().toUpperCase();
  if (hasLongRun(normalized)) {
    return { ok: false, direction, code: "tooManyRepeats" };
  }
  const value = fromRoman(normalized);
  const numeral = value === null ? null : toRoman(value);
  if (value === null || numeral !== normalized) {
    return { ok: false, direction, code: "badOrder" };
  }
  return { ok: true, direction, numeral, value };
}
