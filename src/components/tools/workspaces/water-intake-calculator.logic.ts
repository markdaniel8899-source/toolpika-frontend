/** Pure arithmetic for a daily water intake estimate. No DOM, React or locale formatting. */

export type WeightUnit = "kg" | "lb";
export type ActivityLevel = "sedentary" | "light" | "moderate" | "active";

export const WEIGHT_UNITS: readonly WeightUnit[] = ["kg", "lb"];
export const ACTIVITY_LEVELS: readonly ActivityLevel[] = [
  "sedentary",
  "light",
  "moderate",
  "active",
];

const KG_PER_LB = 0.45359237;
const ML_PER_KG = 35;
const ACTIVITY_FACTOR: Record<ActivityLevel, number> = {
  sedentary: 1,
  light: 1.1,
  moderate: 1.2,
  active: 1.35,
};
const EXERCISE_ML = 500;
const CLIMATE_ML = 500;
export const GLASS_ML = 250;
export const BOTTLE_ML = 500;

const LIMITS: Record<WeightUnit, [number, number]> = {
  kg: [1, 400],
  lb: [2, 900],
};

export const DEFAULTS = {
  unit: "kg" as WeightUnit,
  kg: 70,
  lb: 154,
  activity: "moderate" as ActivityLevel,
};

export type WaterErrorCode = "INVALID_NUMBER" | "OUT_OF_RANGE";

export interface WaterInput {
  weight: number;
  unit: WeightUnit;
  activity: ActivityLevel;
  exerciseBoost: boolean;
  climateBoost: boolean;
}

export interface WaterResult {
  weightKg: number;
  baseMl: number;
  adjustedMl: number;
  boostMl: number;
  totalMl: number;
  glasses: number;
  bottles: number;
  error?: { code: WaterErrorCode };
}

function fail(code: WaterErrorCode): WaterResult {
  return {
    weightKg: 0,
    baseMl: 0,
    adjustedMl: 0,
    boostMl: 0,
    totalMl: 0,
    glasses: 0,
    bottles: 0,
    error: { code },
  };
}

function roundMl(value: number): number {
  return Math.round(value / 10) * 10;
}

function round1(value: number): number {
  return Math.round((value + Number.EPSILON) * 10) / 10;
}

/** Convert a weight between kilograms and pounds, rounded to whole units. */
export function convertWeight(value: number, from: WeightUnit, to: WeightUnit): number {
  if (from === to) return value;
  return from === "kg" ? value / KG_PER_LB : value * KG_PER_LB;
}

/**
 * Estimate daily fluid needs from body weight, activity and optional boosts.
 * The baseline is 35 ml per kilogram, scaled by an activity factor, plus
 * 500 ml for exercise and 500 ml for a hot climate when selected.
 */
export function calculateWaterIntake(input: WaterInput): WaterResult {
  const { weight, unit, activity, exerciseBoost, climateBoost } = input;

  if (!Number.isFinite(weight) || weight <= 0) return fail("INVALID_NUMBER");

  const [min, max] = LIMITS[unit];
  if (weight < min || weight > max) return fail("OUT_OF_RANGE");

  const weightKg = unit === "kg" ? weight : weight * KG_PER_LB;
  const baseMl = roundMl(weightKg * ML_PER_KG);
  const adjustedMl = roundMl(baseMl * ACTIVITY_FACTOR[activity]);
  const boostMl = (exerciseBoost ? EXERCISE_ML : 0) + (climateBoost ? CLIMATE_ML : 0);
  const totalMl = adjustedMl + boostMl;

  return {
    weightKg: round1(weightKg),
    baseMl,
    adjustedMl,
    boostMl,
    totalMl,
    glasses: Math.ceil(totalMl / GLASS_ML),
    bottles: Math.ceil(totalMl / BOTTLE_ML),
  };
}

export interface WaterReportLabels {
  title: string;
  weight: string;
  activity: string;
  base: string;
  adjusted: string;
  boost: string;
  total: string;
  glasses: string;
  bottles: string;
  note: string;
  unitKg: string;
  unitLb: string;
  unitMl: string;
  activityLabel: string;
}

/** Render the estimate as plain text for clipboard use. */
export function formatWaterReport(
  result: WaterResult,
  input: WaterInput,
  labels: WaterReportLabels,
): string {
  const unit = input.unit === "kg" ? labels.unitKg : labels.unitLb;
  return [
    labels.title,
    `${labels.weight}: ${input.weight} ${unit}`,
    `${labels.activity}: ${labels.activityLabel}`,
    `${labels.base}: ${result.baseMl} ${labels.unitMl}`,
    `${labels.adjusted}: ${result.adjustedMl} ${labels.unitMl}`,
    `${labels.boost}: ${result.boostMl} ${labels.unitMl}`,
    `${labels.total}: ${result.totalMl} ${labels.unitMl}`,
    `${labels.glasses}: ${result.glasses}`,
    `${labels.bottles}: ${result.bottles}`,
    labels.note,
  ].join("\n");
}
