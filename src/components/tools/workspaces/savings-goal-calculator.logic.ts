/** Pure month by month savings goal simulation. No DOM, React or locale formatting. */

export type CompoundingFrequency = "daily" | "monthly" | "quarterly" | "yearly";

export const COMPOUNDING_FREQUENCIES: readonly CompoundingFrequency[] = [
  "daily",
  "monthly",
  "quarterly",
  "yearly",
];

/** Half a century of monthly steps keeps the simulation finite and predictable. */
export const MAX_MONTHS = 600;

export interface SavingsGoalInput {
  goal: string;
  startingSavings: string;
  monthlyContribution: string;
  annualRate: string;
  frequency: CompoundingFrequency;
}

export type SavingsErrorCode =
  | "MISSING_GOAL"
  | "MISSING_STARTING"
  | "MISSING_CONTRIBUTION"
  | "MISSING_RATE"
  | "INVALID_NUMBER"
  | "NEGATIVE_VALUE"
  | "ZERO_GOAL"
  | "NO_GROWTH"
  | "UNREACHABLE";

export interface SavingsCheckpoint {
  month: number;
  balance: number;
}

export interface SavingsPlan {
  goal: number;
  startingSavings: number;
  months: number;
  years: number;
  remainingMonths: number;
  finalBalance: number;
  /** Recurring deposits only, excluding the opening balance. */
  totalContributed: number;
  totalDeposits: number;
  growth: number;
  checkpoints: SavingsCheckpoint[];
}

export interface SavingsError {
  code: SavingsErrorCode;
  balance?: number;
  shortfall?: number;
  suggestedContribution?: number;
}

export interface SavingsGoalResult {
  value?: SavingsPlan;
  error?: SavingsError;
}

const PERIODS_PER_YEAR: Record<CompoundingFrequency, number> = {
  daily: 365,
  monthly: 12,
  quarterly: 4,
  yearly: 1,
};

export const DEFAULTS: SavingsGoalInput = {
  goal: "12000",
  startingSavings: "2000",
  monthlyContribution: "300",
  annualRate: "5",
  frequency: "monthly",
};

/** Null means the field is empty, NaN means it is not a finite number. */
function parse(raw: string): number | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const value = Number(trimmed);
  return Number.isFinite(value) ? value : Number.NaN;
}

/**
 * Convert the quoted nominal annual rate and compounding frequency into one
 * equivalent monthly growth factor. This preserves the same effective annual
 * return while letting the simulation post growth every month.
 */
function monthlyGrowthFactor(annualRate: number, frequency: CompoundingFrequency): number {
  const periods = PERIODS_PER_YEAR[frequency];
  const periodic = 1 + annualRate / 100 / periods;
  return Math.pow(Math.max(periodic, 1), periods / 12);
}

interface Simulation {
  months: number;
  balances: number[];
  reached: boolean;
}

/** Add growth first, then the contribution at month end, and check the goal. */
function simulate(
  starting: number,
  contribution: number,
  factor: number,
  goal: number,
): Simulation {
  const balances = [starting];
  if (starting >= goal) return { months: 0, balances, reached: true };

  for (let month = 1; month <= MAX_MONTHS; month += 1) {
    const balance = balances[month - 1] * factor + contribution;
    balances.push(balance);
    if (balance >= goal) return { months: month, balances, reached: true };
  }
  return { months: MAX_MONTHS, balances, reached: false };
}

/** Smallest whole monthly deposit that reaches the goal inside the cap. */
function suggestContribution(goal: number, starting: number, factor: number): number {
  let low = 0;
  let high = Math.max(1, Math.ceil(goal));
  for (let step = 0; step < 80; step += 1) {
    const middle = Math.ceil((low + high) / 2);
    if (simulate(starting, middle, factor, goal).reached) high = middle;
    else low = middle + 1;
  }
  return high;
}

function buildCheckpoints(balances: number[], months: number): SavingsCheckpoint[] {
  if (months === 0) return [{ month: 0, balance: balances[0] }];

  const checkpoints: SavingsCheckpoint[] = [];
  const used = new Set<number>();
  for (const fraction of [0.25, 0.5, 0.75, 1]) {
    const month = fraction === 1 ? months : Math.max(1, Math.round(months * fraction));
    if (used.has(month)) continue;
    used.add(month);
    checkpoints.push({
      month,
      balance: balances[month] ?? balances[balances.length - 1],
    });
  }
  return checkpoints;
}

function buildPlan(
  goal: number,
  starting: number,
  contribution: number,
  months: number,
  balances: number[],
): SavingsPlan {
  const finalBalance = balances[months];
  const totalContributed = contribution * months;
  return {
    goal,
    startingSavings: starting,
    months,
    years: Math.floor(months / 12),
    remainingMonths: months % 12,
    finalBalance,
    totalContributed,
    totalDeposits: starting + totalContributed,
    growth: Math.max(0, finalBalance - starting - totalContributed),
    checkpoints: buildCheckpoints(balances, months),
  };
}

export function calculateSavingsGoal(input: SavingsGoalInput): SavingsGoalResult {
  const goal = parse(input.goal);
  const starting = parse(input.startingSavings);
  const contribution = parse(input.monthlyContribution);
  const rate = parse(input.annualRate);

  if (goal === null) return { error: { code: "MISSING_GOAL" } };
  if (starting === null) return { error: { code: "MISSING_STARTING" } };
  if (contribution === null) return { error: { code: "MISSING_CONTRIBUTION" } };
  if (rate === null) return { error: { code: "MISSING_RATE" } };

  const numbers = [goal, starting, contribution, rate];
  if (numbers.some((value) => Number.isNaN(value))) {
    return { error: { code: "INVALID_NUMBER" } };
  }
  if (numbers.some((value) => value < 0)) {
    return { error: { code: "NEGATIVE_VALUE" } };
  }
  if (goal === 0) return { error: { code: "ZERO_GOAL" } };

  const factor = monthlyGrowthFactor(rate, input.frequency);
  const simulation = simulate(starting, contribution, factor, goal);

  if (simulation.reached) {
    return {
      value: buildPlan(goal, starting, contribution, simulation.months, simulation.balances),
    };
  }

  const balance = simulation.balances[MAX_MONTHS];
  if (contribution === 0 && factor === 1) {
    return { error: { code: "NO_GROWTH", balance, shortfall: goal - balance } };
  }

  return {
    error: {
      code: "UNREACHABLE",
      balance,
      shortfall: goal - balance,
      suggestedContribution: suggestContribution(goal, starting, factor),
    },
  };
}

export interface SavingsReportLabels {
  title: string;
  goal: string;
  starting: string;
  contribution: string;
  rate: string;
  frequency: string;
  months: string;
  timeline: string;
  totalContributed: string;
  growth: string;
  finalBalance: string;
  yearsUnit: string;
  monthsUnit: string;
  note: string;
}

/** Render a reached plan as plain text for clipboard use. */
export function formatSavingsPlan(
  plan: SavingsPlan,
  input: SavingsGoalInput,
  labels: SavingsReportLabels,
  frequencyLabel: string,
  format: (value: number) => string,
): string {
  const timeline = `${format(plan.years)} ${labels.yearsUnit} ${format(plan.remainingMonths)} ${labels.monthsUnit}`.trim();
  return [
    labels.title,
    `${labels.goal}: ${format(plan.goal)}`,
    `${labels.starting}: ${format(plan.startingSavings)}`,
    `${labels.contribution}: ${format(Number(input.monthlyContribution) || 0)}`,
    `${labels.rate}: ${input.annualRate.trim()}%`,
    `${labels.frequency}: ${frequencyLabel}`,
    `${labels.months}: ${format(plan.months)}`,
    `${labels.timeline}: ${timeline}`,
    `${labels.totalContributed}: ${format(plan.totalContributed)}`,
    `${labels.growth}: ${format(plan.growth)}`,
    `${labels.finalBalance}: ${format(plan.finalBalance)}`,
    labels.note,
  ].join("\n");
}
