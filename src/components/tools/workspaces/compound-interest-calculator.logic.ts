/** Pure compound interest mathematics. No DOM, no React, no locale formatting. */

export interface CompoundInput {
  principal: number;
  /** Nominal annual rate in percent, so 5 means 5 percent per year. */
  annualRate: number;
  /** Whole years. */
  years: number;
  /** Number of compounding periods in one year. */
  compoundsPerYear: number;
}

export interface CompoundYear {
  year: number;
  opening: number;
  interest: number;
  closing: number;
}

export type CompoundError = "INVALID_NUMBER" | "INVALID_RANGE" | "TOO_LARGE";

export interface CompoundResult {
  finalAmount: number;
  interestEarned: number;
  /** Effective annual rate in percent after compounding. */
  effectiveAnnualRate: number;
  years: CompoundYear[];
  error?: CompoundError;
}

export const MAX_YEARS = 100;
export const MAX_COMPOUNDS_PER_YEAR = 365;

export const DEFAULTS: CompoundInput = {
  principal: 10000,
  annualRate: 5,
  years: 10,
  compoundsPerYear: 12,
};

function fail(error: CompoundError): CompoundResult {
  return {
    finalAmount: 0,
    interestEarned: 0,
    effectiveAnnualRate: 0,
    years: [],
    error,
  };
}

/** Balance after a whole number of years using A = P (1 + r/n)^(n t). */
function balanceAt(input: CompoundInput, year: number): number {
  const ratePerPeriod = input.annualRate / 100 / input.compoundsPerYear;
  const periods = input.compoundsPerYear * year;
  return input.principal * Math.pow(1 + ratePerPeriod, periods);
}

/**
 * Work out the final amount, interest earned, effective rate and a balance
 * row for every year. Raw numbers are returned; the UI owns all rounding.
 */
export function calculateCompound(input: CompoundInput): CompoundResult {
  const { principal, annualRate, years, compoundsPerYear } = input;

  if (
    ![principal, annualRate, years, compoundsPerYear].every((value) =>
      Number.isFinite(value)
    )
  ) {
    return fail("INVALID_NUMBER");
  }

  if (
    principal < 0 ||
    annualRate < 0 ||
    years < 1 ||
    compoundsPerYear < 1 ||
    !Number.isInteger(years) ||
    !Number.isInteger(compoundsPerYear)
  ) {
    return fail("INVALID_RANGE");
  }

  if (years > MAX_YEARS || compoundsPerYear > MAX_COMPOUNDS_PER_YEAR) {
    return fail("TOO_LARGE");
  }

  const finalAmount = balanceAt(input, years);
  const interestEarned = finalAmount - principal;
  const ratePerPeriod = annualRate / 100 / compoundsPerYear;
  const effectiveAnnualRate =
    (Math.pow(1 + ratePerPeriod, compoundsPerYear) - 1) * 100;

  const yearRows: CompoundYear[] = [];
  let opening = principal;
  for (let year = 1; year <= years; year += 1) {
    const closing = balanceAt(input, year);
    yearRows.push({
      year,
      opening,
      interest: closing - opening,
      closing,
    });
    opening = closing;
  }

  return {
    finalAmount,
    interestEarned,
    effectiveAnnualRate,
    years: yearRows,
  };
}
