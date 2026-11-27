/** Pure loan EMI mathematics. No DOM, no React, no locale formatting. */

export interface EmiInput {
  principal: number;
  /** Nominal annual rate in percent, so 8.5 means 8.5 percent per year. */
  annualRate: number;
  /** Loan term measured in whole months. */
  tenureMonths: number;
}

export interface AmortisationRow {
  month: number;
  payment: number;
  interest: number;
  principalPaid: number;
  balance: number;
}

export type EmiError = "INVALID_NUMBER" | "INVALID_RANGE" | "TOO_LONG";

export interface EmiResult {
  emi: number;
  totalInterest: number;
  totalPayable: number;
  /** Monthly rate as a decimal, so 8.5 percent a year becomes about 0.0070833. */
  monthlyRate: number;
  /** First few months of the reducing balance schedule. */
  preview: AmortisationRow[];
  error?: EmiError;
}

export const MAX_TENURE_MONTHS = 1200;
export const PREVIEW_MONTHS = 6;

export const DEFAULTS: EmiInput = {
  principal: 200000,
  annualRate: 8.5,
  tenureMonths: 240,
};

function fail(error: EmiError): EmiResult {
  return {
    emi: 0,
    totalInterest: 0,
    totalPayable: 0,
    monthlyRate: 0,
    preview: [],
    error,
  };
}

/**
 * Standard reducing balance EMI:
 * EMI = P r (1 + r)^n / ((1 + r)^n - 1), with r as the monthly decimal rate.
 * When r is zero the payment is simply the principal spread over the months.
 */
export function calculateEmi(input: EmiInput): EmiResult {
  const { principal, annualRate, tenureMonths } = input;

  if (![principal, annualRate, tenureMonths].every((value) => Number.isFinite(value))) {
    return fail("INVALID_NUMBER");
  }

  if (
    principal <= 0 ||
    annualRate < 0 ||
    tenureMonths < 1 ||
    !Number.isInteger(tenureMonths)
  ) {
    return fail("INVALID_RANGE");
  }

  if (tenureMonths > MAX_TENURE_MONTHS) {
    return fail("TOO_LONG");
  }

  const monthlyRate = annualRate / 1200;
  const growth = Math.pow(1 + monthlyRate, tenureMonths);
  const emi =
    monthlyRate === 0
      ? principal / tenureMonths
      : (principal * monthlyRate * growth) / (growth - 1);

  const totalPayable = emi * tenureMonths;
  const totalInterest = totalPayable - principal;

  const preview: AmortisationRow[] = [];
  let balance = principal;
  const previewCount = Math.min(PREVIEW_MONTHS, tenureMonths);
  for (let month = 1; month <= previewCount; month += 1) {
    const interest = balance * monthlyRate;
    const principalPaid = emi - interest;
    balance = Math.max(0, balance - principalPaid);
    preview.push({
      month,
      payment: emi,
      interest,
      principalPaid,
      balance,
    });
  }

  return {
    emi,
    totalInterest,
    totalPayable,
    monthlyRate,
    preview,
  };
}
