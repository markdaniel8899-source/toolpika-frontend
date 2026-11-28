/**
 * Pure return on investment arithmetic. No DOM, React, storage or network.
 * Percentages are returned as plain numbers, for example 45 means 45 percent.
 */

export type RoiErrorCode =
  | "EMPTY_INVESTMENT"
  | "INVALID_INVESTMENT"
  | "ZERO_INVESTMENT"
  | "EMPTY_PROFIT"
  | "INVALID_PROFIT"
  | "EMPTY_YEARS"
  | "INVALID_YEARS"
  | "YEARS_OUT_OF_RANGE";

export interface RoiInput {
  investment: string;
  profit: string;
  years: string;
}

export interface RoiResult {
  roi: number | null;
  cagr: number | null;
  netGain: number | null;
  endingValue: number | null;
  multiple: number | null;
  error?: { code: RoiErrorCode };
}

const blank: RoiResult = {
  roi: null,
  cagr: null,
  netGain: null,
  endingValue: null,
  multiple: null,
};

function round(value: number): number {
  return Math.round(value * 100) / 100;
}

/** Compute ROI, gain, ending value, money multiple and annualised return. */
export function calculateRoi(input: RoiInput): RoiResult {
  if (input.investment.trim().length === 0) {
    return { ...blank, error: { code: "EMPTY_INVESTMENT" } };
  }
  const investment = Number(input.investment);
  if (!Number.isFinite(investment)) {
    return { ...blank, error: { code: "INVALID_INVESTMENT" } };
  }
  if (investment <= 0) {
    return { ...blank, error: { code: "ZERO_INVESTMENT" } };
  }

  if (input.profit.trim().length === 0) {
    return { ...blank, error: { code: "EMPTY_PROFIT" } };
  }
  const profit = Number(input.profit);
  if (!Number.isFinite(profit)) {
    return { ...blank, error: { code: "INVALID_PROFIT" } };
  }

  if (input.years.trim().length === 0) {
    return { ...blank, error: { code: "EMPTY_YEARS" } };
  }
  const years = Number(input.years);
  if (!Number.isFinite(years)) {
    return { ...blank, error: { code: "INVALID_YEARS" } };
  }
  if (years <= 0 || years > 100) {
    return { ...blank, error: { code: "YEARS_OUT_OF_RANGE" } };
  }

  const endingValue = investment + profit;
  const roi = round((profit / investment) * 100);
  const multiple = round(endingValue / investment);
  const cagr = endingValue > 0
    ? round((Math.pow(endingValue / investment, 1 / years) - 1) * 100)
    : null;

  return {
    roi,
    cagr,
    netGain: round(profit),
    endingValue: round(endingValue),
    multiple,
  };
}
