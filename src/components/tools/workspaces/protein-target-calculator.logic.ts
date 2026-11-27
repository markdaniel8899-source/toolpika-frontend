/** Pure protein target arithmetic. No DOM, React or locale formatting. */

export type Goal = "maintenance" | "muscleGain" | "fatLoss";
export type Activity = "low" | "moderate" | "high";

export const GOALS: readonly Goal[] = ["maintenance", "muscleGain", "fatLoss"];
export const ACTIVITY_LEVELS: readonly Activity[] = ["low", "moderate", "high"];

/** Grams of protein per kilogram of body weight for each goal. */
export const GOAL_RANGES: Record<Goal, { min: number; max: number }> = {
  maintenance: { min: 1.2, max: 1.6 },
  muscleGain: { min: 1.6, max: 2.2 },
  fatLoss: { min: 1.6, max: 2.4 },
};

/** Activity nudges both ends of the goal range by a small stated amount. */
export const ACTIVITY_ADJUSTMENTS: Record<Activity, number> = {
  low: 0,
  moderate: 0.1,
  high: 0.2,
};

const WEIGHT_LIMITS = [10, 500] as const;

export interface ProteinInput {
  weight: number;
  goal: Goal;
  activity: Activity;
}

export const DEFAULTS: Pick<ProteinInput, "goal" | "activity"> = {
  goal: "maintenance",
  activity: "moderate",
};

export type ProteinError = "INVALID_NUMBER" | "OUT_OF_RANGE";

export interface ProteinResult {
  baseRange: { min: number; max: number };
  adjustment: number;
  perKg: { min: number; max: number };
  perDay: { min: number; max: number };
  target: number;
  formula: string;
  error?: ProteinError;
}

function fail(error: ProteinError): ProteinResult {
  return {
    baseRange: { min: 0, max: 0 },
    adjustment: 0,
    perKg: { min: 0, max: 0 },
    perDay: { min: 0, max: 0 },
    target: 0,
    formula: "",
    error,
  };
}

function round1(value: number): number {
  return Math.round((value + Number.EPSILON) * 10) / 10;
}

/**
 * Pick the goal range, shift it by the activity adjustment, then convert the
 * grams per kilogram range into a daily gram range for the entered weight.
 */
export function calculateProtein(input: ProteinInput): ProteinResult {
  const { weight, goal, activity } = input;

  if (!Number.isFinite(weight)) {
    return fail("INVALID_NUMBER");
  }

  if (!(goal in GOAL_RANGES) || !(activity in ACTIVITY_ADJUSTMENTS)) {
    return fail("INVALID_NUMBER");
  }

  if (weight < WEIGHT_LIMITS[0] || weight > WEIGHT_LIMITS[1]) {
    return fail("OUT_OF_RANGE");
  }

  const baseRange = GOAL_RANGES[goal];
  const adjustment = ACTIVITY_ADJUSTMENTS[activity];
  const min = round1(baseRange.min + adjustment);
  const max = round1(baseRange.max + adjustment);
  const dailyMin = weight * min;
  const dailyMax = weight * max;

  return {
    baseRange,
    adjustment,
    perKg: { min, max },
    perDay: { min: dailyMin, max: dailyMax },
    target: Math.round(((min + max) / 2) * weight),
    formula:
      `${weight} kg × ${min} to ${max} g/kg = ` +
      `${Math.round(dailyMin)} to ${Math.round(dailyMax)} g/day`,
  };
}

export interface ProteinReportLabels {
  title: string;
  perKg: string;
  perDay: string;
  target: string;
  formula: string;
  unit: string;
  note: string;
}

/** Plain-text target for clipboard and download. Numbers are rounded here. */
export function formatProteinReport(
  result: ProteinResult,
  labels: ProteinReportLabels,
): string {
  return [
    labels.title,
    `${labels.perKg}: ${result.perKg.min} - ${result.perKg.max} g/kg`,
    `${labels.perDay}: ${Math.round(result.perDay.min)} - ${Math.round(result.perDay.max)} ${labels.unit}`,
    `${labels.target}: ${result.target} ${labels.unit}`,
    `${labels.formula}: ${result.formula}`,
    labels.note,
  ].join("\n");
}
