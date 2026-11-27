/** Pure profit, gross margin and markup arithmetic. No DOM, React or locale formatting. */

export type ProfitMode = "margin" | "markup";

export type ProfitErrorCode = "INVALID_NUMBER" | "ZERO_VALUE" | "TARGET_RANGE";

/** Neutral starting values for the Try sample action, never a recommendation. */
export const DEFAULTS: {
  mode: ProfitMode;
  cost: number;
  sellingPrice: number;
  target: number;
} = {
  mode: "margin",
  cost: 40,
  sellingPrice: 60,
  target: 30,
};

/** A margin cannot reach 100 percent; a markup has no such ceiling. */
export const TARGET_LIMITS: Record<ProfitMode, number> = {
  margin: 100,
  markup: 1000,
};

export interface ProfitInput {
  cost: number;
  sellingPrice: number;
  mode: ProfitMode;
  target: number;
}

export interface ProfitResult {
  netProfit: number;
  grossMargin: number;
  markup: number;
  targetPrice: number;
  gap: number;
  error?: { code: ProfitErrorCode };
}

function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function fail(code: ProfitErrorCode): ProfitResult {
  return {
    netProfit: 0,
    grossMargin: 0,
    markup: 0,
    targetPrice: 0,
    gap: 0,
    error: { code },
  };
}

/**
 * Margin divides profit by the selling price. Markup divides profit by cost.
 * The target price is the price needed to reach the chosen target, and the
 * gap is that price minus the entered selling price.
 */
export function calculateProfit(input: ProfitInput): ProfitResult {
  const { cost, sellingPrice, mode, target } = input;

  if (
    ![cost, sellingPrice, target].every(Number.isFinite) ||
    cost < 0 ||
    sellingPrice < 0 ||
    target < 0
  ) {
    return fail("INVALID_NUMBER");
  }
  if (cost === 0 || sellingPrice === 0) {
    return fail("ZERO_VALUE");
  }
  if (target >= TARGET_LIMITS[mode]) {
    return fail("TARGET_RANGE");
  }

  const netProfit = sellingPrice - cost;
  const grossMargin = (netProfit / sellingPrice) * 100;
  const markup = (netProfit / cost) * 100;
  const targetPrice = mode === "margin"
    ? cost / (1 - target / 100)
    : cost * (1 + target / 100);
  const gap = targetPrice - sellingPrice;

  return {
    netProfit: round2(netProfit),
    grossMargin: round2(grossMargin),
    markup: round2(markup),
    targetPrice: round2(targetPrice),
    gap: round2(gap),
  };
}
