/** Pure freelance rate arithmetic. No DOM, React or locale formatting. */

export type FreelanceErrorCode = "INVALID_NUMBER" | "ZERO_TIME" | "TAX_RANGE";

/** Neutral starting values for the Try sample action, never a recommendation. */
export const DEFAULTS = {
  targetNetIncome: 60000,
  billableWeeks: 46,
  billableHoursPerWeek: 30,
  billableDaysPerWeek: 5,
  annualExpenses: 6000,
  taxBufferPercent: 25,
  hoursPerProject: 20,
} as const;

/** A tax and buffer share of 100 percent would leave no income at all. */
export const TAX_LIMIT = 100;

export interface FreelanceInput {
  targetNetIncome: number;
  billableWeeks: number;
  billableHoursPerWeek: number;
  billableDaysPerWeek: number;
  annualExpenses: number;
  taxBufferPercent: number;
  hoursPerProject: number;
}

export interface FreelanceResult {
  hourlyRate: number;
  dailyRate: number;
  projectRate: number;
  grossRevenue: number;
  billableHours: number;
  error?: { code: FreelanceErrorCode };
}

function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function fail(code: FreelanceErrorCode): FreelanceResult {
  return {
    hourlyRate: 0,
    dailyRate: 0,
    projectRate: 0,
    grossRevenue: 0,
    billableHours: 0,
    error: { code },
  };
}

/**
 * Required revenue is net income plus expenses, grossed up for the combined
 * tax and buffer share. Dividing by total billable hours gives the hourly
 * baseline, and the daily and project rates scale that same baseline.
 */
export function calculateFreelanceRate(input: FreelanceInput): FreelanceResult {
  const {
    targetNetIncome,
    billableWeeks,
    billableHoursPerWeek,
    billableDaysPerWeek,
    annualExpenses,
    taxBufferPercent,
    hoursPerProject,
  } = input;

  const values = [
    targetNetIncome,
    billableWeeks,
    billableHoursPerWeek,
    billableDaysPerWeek,
    annualExpenses,
    taxBufferPercent,
    hoursPerProject,
  ];
  if (!values.every(Number.isFinite) || values.some((value) => value < 0)) {
    return fail("INVALID_NUMBER");
  }
  if (
    billableWeeks === 0 ||
    billableHoursPerWeek === 0 ||
    billableDaysPerWeek === 0
  ) {
    return fail("ZERO_TIME");
  }
  if (taxBufferPercent >= TAX_LIMIT) {
    return fail("TAX_RANGE");
  }

  const grossRevenue =
    (targetNetIncome + annualExpenses) / (1 - taxBufferPercent / 100);
  const billableHours = billableWeeks * billableHoursPerWeek;
  const hourlyRate = grossRevenue / billableHours;
  const dailyHours = billableHoursPerWeek / billableDaysPerWeek;

  return {
    hourlyRate: round2(hourlyRate),
    dailyRate: round2(hourlyRate * dailyHours),
    projectRate: round2(hourlyRate * hoursPerProject),
    grossRevenue: round2(grossRevenue),
    billableHours: round2(billableHours),
  };
}
