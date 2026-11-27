/** Pure calorie timeline arithmetic. No DOM, React or locale formatting. */

export type DeficitMode = "deficit" | "surplus";
export type DeficitDirection = "lose" | "gain";
export type PaceCode = "slow" | "gentle" | "steady" | "aggressive";
export type DeficitErrorCode =
  | "INVALID_NUMBER"
  | "OUT_OF_RANGE"
  | "SAME_WEIGHT"
  | "ZERO_CHANGE"
  | "WRONG_DIRECTION";

/** Common planning estimate for the energy stored in one kilogram of body mass. */
export const KCAL_PER_KG = 7700;

export const DEFICIT_MODES: readonly DeficitMode[] = ["deficit", "surplus"];

/** Ranges that keep the timeline meaningful for adults. */
export const LIMITS = {
  weight: [10, 500],
  dailyKcal: [0, 10000],
} as const;

/** Weekly change in kilograms used to sort a plan into a pacing band. */
export const PACE_BANDS = {
  slow: 0.25,
  gentle: 0.5,
  steady: 1,
} as const;

export interface DeficitInput {
  currentWeight: number;
  targetWeight: number;
  mode: DeficitMode;
  dailyKcal: number;
}

export const DEFAULT_DEFICIT_INPUT: DeficitInput = {
  currentWeight: 80,
  targetWeight: 75,
  mode: "deficit",
  dailyKcal: 500,
};

export interface DeficitResult {
  direction: DeficitDirection;
  weightChangeKg: number;
  totalKcal: number;
  days: number;
  weeks: number;
  weeklyKg: number;
  pace: PaceCode;
  error?: DeficitErrorCode;
}

function fail(error: DeficitErrorCode): DeficitResult {
  return {
    direction: "lose",
    weightChangeKg: 0,
    totalKcal: 0,
    days: 0,
    weeks: 0,
    weeklyKg: 0,
    pace: "steady",
    error,
  };
}

function inRange(value: number, [min, max]: readonly [number, number]): boolean {
  return value >= min && value <= max;
}

function paceFor(weeklyKg: number): PaceCode {
  if (weeklyKg < PACE_BANDS.slow) return "slow";
  if (weeklyKg < PACE_BANDS.gentle) return "gentle";
  if (weeklyKg <= PACE_BANDS.steady) return "steady";
  return "aggressive";
}

/**
 * The energy gap is the absolute weight change times 7700 kcal per kilogram.
 * Dividing by the daily gap gives days, and dividing by seven gives weeks.
 * A deficit removes weight, so the target must sit below the current weight.
 * A surplus adds weight, so the target must sit above it.
 */
export function calculateDeficit(input: DeficitInput): DeficitResult {
  const { currentWeight, targetWeight, mode, dailyKcal } = input;

  if (
    ![currentWeight, targetWeight, dailyKcal].every((value) =>
      Number.isFinite(value),
    ) ||
    !DEFICIT_MODES.includes(mode)
  ) {
    return fail("INVALID_NUMBER");
  }

  if (
    !inRange(currentWeight, LIMITS.weight) ||
    !inRange(targetWeight, LIMITS.weight) ||
    !inRange(dailyKcal, LIMITS.dailyKcal)
  ) {
    return fail("OUT_OF_RANGE");
  }

  if (currentWeight === targetWeight) return fail("SAME_WEIGHT");
  if (dailyKcal === 0) return fail("ZERO_CHANGE");

  const direction: DeficitDirection =
    currentWeight > targetWeight ? "lose" : "gain";
  const expected: DeficitDirection = mode === "deficit" ? "lose" : "gain";
  if (direction !== expected) return fail("WRONG_DIRECTION");

  const weightChangeKg = Math.abs(currentWeight - targetWeight);
  const totalKcal = weightChangeKg * KCAL_PER_KG;
  const days = totalKcal / dailyKcal;
  const weeks = days / 7;
  const weeklyKg = (dailyKcal * 7) / KCAL_PER_KG;

  return {
    direction,
    weightChangeKg,
    totalKcal,
    days,
    weeks,
    weeklyKg,
    pace: paceFor(weeklyKg),
  };
}

export interface DeficitReportLabels {
  title: string;
  current: string;
  target: string;
  daily: string;
  change: string;
  gap: string;
  weeks: string;
  days: string;
  weekly: string;
  paceTitle: string;
  pace: Record<PaceCode, string>;
  direction: Record<DeficitDirection, string>;
  unitKg: string;
  unitKcal: string;
  unitWeeks: string;
  unitDays: string;
  note: string;
}

/** Plain-text plan for the clipboard button. Numbers are rounded here. */
export function formatDeficitReport(
  result: DeficitResult,
  input: DeficitInput,
  labels: DeficitReportLabels,
): string {
  if (result.error) return "";
  return [
    labels.title,
    `${labels.current}: ${input.currentWeight} ${labels.unitKg}`,
    `${labels.target}: ${input.targetWeight} ${labels.unitKg}`,
    `${labels.daily}: ${input.dailyKcal} ${labels.unitKcal}`,
    `${labels.change}: ${labels.direction[result.direction]} ${result.weightChangeKg.toFixed(1)} ${labels.unitKg}`,
    `${labels.gap}: ${Math.round(result.totalKcal)} ${labels.unitKcal}`,
    `${labels.weeks}: ${result.weeks.toFixed(1)} ${labels.unitWeeks}`,
    `${labels.days}: ${Math.round(result.days)} ${labels.unitDays}`,
    `${labels.weekly}: ${result.weeklyKg.toFixed(2)} ${labels.unitKg}`,
    `${labels.paceTitle}: ${labels.pace[result.pace]}`,
    labels.note,
  ].join("\n");
}
