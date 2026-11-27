/** Pure tip, tax and bill split arithmetic. No DOM, no React, no formatting. */

export interface SplitInput {
  bill: number;
  tipPercent: number;
  taxPercent: number;
  includeTax: boolean;
  splitCount: number;
  roundPerPerson: boolean;
}

export type SplitError =
  | "INVALID_NUMBER"
  | "NEGATIVE_VALUE"
  | "INVALID_SPLIT"
  | "TOO_MANY_PEOPLE";

export interface SplitResult {
  bill: number;
  tax: number;
  tip: number;
  total: number;
  perPerson: number;
  rawPerPerson: number;
  splitCount: number;
  rounded: boolean;
  error?: SplitError;
}

/** Preset rates shown as quick choices. Custom is handled by the UI. */
export const TIP_PRESETS = [0, 15, 18, 20] as const;
export const MAX_PEOPLE = 100;

export const DEFAULTS: SplitInput = {
  bill: 84.5,
  tipPercent: 18,
  taxPercent: 8.5,
  includeTax: true,
  splitCount: 3,
  roundPerPerson: false,
};

function fail(error: SplitError): SplitResult {
  return {
    bill: 0,
    tax: 0,
    tip: 0,
    total: 0,
    perPerson: 0,
    rawPerPerson: 0,
    splitCount: 0,
    rounded: false,
    error,
  };
}

/**
 * Tip is calculated on the pre-tax bill. Tax is a single flat rate on the
 * same bill. The total is then divided evenly; rounding is optional and is
 * applied only to the final share. Raw numbers are returned, UI owns display.
 */
export function calculateSplit(input: SplitInput): SplitResult {
  const {
    bill,
    tipPercent,
    taxPercent,
    includeTax,
    splitCount,
    roundPerPerson,
  } = input;

  if (![bill, tipPercent, taxPercent, splitCount].every(Number.isFinite)) {
    return fail("INVALID_NUMBER");
  }

  if (bill < 0 || tipPercent < 0 || taxPercent < 0) {
    return fail("NEGATIVE_VALUE");
  }

  if (!Number.isInteger(splitCount) || splitCount < 1) {
    return fail("INVALID_SPLIT");
  }

  if (splitCount > MAX_PEOPLE) {
    return fail("TOO_MANY_PEOPLE");
  }

  const tax = includeTax ? bill * (taxPercent / 100) : 0;
  const tip = bill * (tipPercent / 100);
  const total = bill + tax + tip;
  const rawPerPerson = total / splitCount;
  const perPerson = roundPerPerson ? Math.round(rawPerPerson) : rawPerPerson;

  return {
    bill,
    tax,
    tip,
    total,
    perPerson,
    rawPerPerson,
    splitCount,
    rounded: roundPerPerson,
  };
}
