/** Pure break-even arithmetic. No DOM, React or locale formatting. */

export type BreakEvenErrorCode = "INVALID_NUMBER" | "ZERO_MARGIN" | "NEGATIVE_MARGIN";

/** Neutral starting values for the Try sample action, never a recommendation. */
export const DEFAULTS = {
  fixedCosts: 4000,
  pricePerUnit: 50,
  variableCostPerUnit: 30,
} as const;

export interface BreakEvenInput {
  fixedCosts: number;
  pricePerUnit: number;
  variableCostPerUnit: number;
}

export interface BreakEvenResult {
  units: number;
  revenue: number;
  exactUnits: number;
  contribution: number;
  ratio: number;
  error?: { code: BreakEvenErrorCode };
}

function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function fail(code: BreakEvenErrorCode): BreakEvenResult {
  return {
    units: 0,
    revenue: 0,
    exactUnits: 0,
    contribution: 0,
    ratio: 0,
    error: { code },
  };
}

/**
 * Contribution per unit is the price left after variable cost. It is the
 * amount each sale adds toward fixed costs. A zero or negative contribution
 * means no volume can ever cover those costs.
 */
export function calculateBreakEven(input: BreakEvenInput): BreakEvenResult {
  const { fixedCosts, pricePerUnit, variableCostPerUnit } = input;
  const values = [fixedCosts, pricePerUnit, variableCostPerUnit];

  if (!values.every(Number.isFinite) || values.some((value) => value < 0)) {
    return fail("INVALID_NUMBER");
  }

  const contribution = pricePerUnit - variableCostPerUnit;
  if (contribution === 0) {
    return fail("ZERO_MARGIN");
  }
  if (contribution < 0) {
    return fail("NEGATIVE_MARGIN");
  }

  const exactUnits = fixedCosts / contribution;
  const units = Math.ceil(Number(exactUnits.toFixed(9)));

  return {
    units,
    revenue: round2(units * pricePerUnit),
    exactUnits: round2(exactUnits),
    contribution: round2(contribution),
    ratio: round2((contribution / pricePerUnit) * 100),
  };
}
