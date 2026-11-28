/**
 * Pure return on investment arithmetic. No DOM, React, storage or network.
 * Percentages are returned as plain numbers, for example 45 means 45 percent.
 */

export type RoiErrorCode =
  | "EMPTY_INVESTMENT"
  | "INVALID_INVESTMENT"
  | "ZERO_INVESTMENT"
  | "EMPTY_RETURNED"
  | "INVALID_RETURNED"
  | "EMPTY_YEARS"
  | "INVALID_YEARS"
  | "YEARS_OUT_OF_RANGE";

export interface RoiInput {
  investment: string;
  returnedValue: string;
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

  if (input.returnedValue.trim().length === 0) {
    return { ...blank, error: { code: "EMPTY_RETURNED" } };
  }
  const returnedValue = Number(input.returnedValue);
  if (!Number.isFinite(returnedValue)) {
    return { ...blank, error: { code: "INVALID_RETURNED" } };
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

  const netGain = round(returnedValue - investment);
  const roi = round((netGain / investment) * 100);
  const multiple = round(returnedValue / investment);
  const cagr = returnedValue > 0
    ? round((Math.pow(returnedValue / investment, 1 / years) - 1) * 100)
    : null;

  return {
    roi,
    cagr,
    netGain,
    endingValue: round(returnedValue),
    multiple,
  };
}
