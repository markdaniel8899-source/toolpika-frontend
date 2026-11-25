/** Pure percentage arithmetic. No DOM, no React, no locale formatting. */

export type Mode =
  | "percentOf"
  | "whatPercent"
  | "percentChange"
  | "increaseBy"
  | "decreaseBy";

export type CalculationError = "DIVISION_BY_ZERO" | "INVALID_NUMBER";

export interface Calculation {
  value: number;
  formula: string;
  steps: string[];
  error?: CalculationError;
}

export const MODES: readonly Mode[] = [
  "percentOf",
  "whatPercent",
  "percentChange",
  "increaseBy",
  "decreaseBy",
];

export const DEFAULTS: { mode: Mode; a: number; b: number } = {
  mode: "percentOf",
  a: 18,
  b: 250,
};

const MAX_DECIMALS = 1_000_000;

function round(value: number): number {
  return Math.round((value + Number.EPSILON) * MAX_DECIMALS) / MAX_DECIMALS;
}

function show(value: number): string {
  return String(round(value));
}

function fail(error: CalculationError): Calculation {
  return { value: 0, formula: "", steps: [], error };
}

function done(value: number, formula: string, steps: string[]): Calculation {
  return { value: round(value), formula, steps };
}

/** Evaluate one of the five supported percentage problems. */
export function calculate(mode: Mode, a: number, b: number): Calculation {
  if (!Number.isFinite(a) || !Number.isFinite(b)) {
    return fail("INVALID_NUMBER");
  }

  switch (mode) {
    case "percentOf": {
      const part = a / 100;
      const value = part * b;
      return done(
        value,
        `${show(a)}% × ${show(b)} = ${show(value)}`,
        [
          `${show(a)} ÷ 100 = ${show(part)}`,
          `${show(part)} × ${show(b)} = ${show(value)}`,
        ],
      );
    }
    case "whatPercent": {
      if (b === 0) return fail("DIVISION_BY_ZERO");
      const ratio = a / b;
      const value = ratio * 100;
      return done(
        value,
        `${show(a)} is ${show(value)}% of ${show(b)}`,
        [
          `${show(a)} ÷ ${show(b)} = ${show(ratio)}`,
          `${show(ratio)} × 100 = ${show(value)}%`,
        ],
      );
    }
    case "percentChange": {
      // Both endpoints must be non-zero: zero cannot serve as the base here.
      if (a === 0 || b === 0) return fail("DIVISION_BY_ZERO");
      const difference = b - a;
      const ratio = difference / a;
      const value = ratio * 100;
      return done(
        value,
        `(${show(b)} − ${show(a)}) ÷ ${show(a)} × 100 = ${show(value)}%`,
        [
          `${show(b)} − ${show(a)} = ${show(difference)}`,
          `${show(difference)} ÷ ${show(a)} = ${show(ratio)}`,
          `${show(ratio)} × 100 = ${show(value)}%`,
        ],
      );
    }
    case "increaseBy": {
      const amount = (a / 100) * b;
      const value = b + amount;
      return done(
        value,
        `${show(b)} + ${show(a)}% = ${show(value)}`,
        [
          `${show(a)}% × ${show(b)} = ${show(amount)}`,
          `${show(b)} + ${show(amount)} = ${show(value)}`,
        ],
      );
    }
    case "decreaseBy": {
      const amount = (a / 100) * b;
      const value = b - amount;
      return done(
        value,
        `${show(b)} − ${show(a)}% = ${show(value)}`,
        [
          `${show(a)}% × ${show(b)} = ${show(amount)}`,
          `${show(b)} − ${show(amount)} = ${show(value)}`,
        ],
      );
    }
  }
}
