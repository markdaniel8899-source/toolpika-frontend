/** Pure TDEE arithmetic using the Mifflin-St Jeor equation. No DOM, React or locale formatting. */

export type Profile = "female" | "male";
export type ActivityLevel =
  | "sedentary"
  | "light"
  | "moderate"
  | "active"
  | "veryActive";

export const PROFILES: readonly Profile[] = ["female", "male"];
export const ACTIVITY_LEVELS: readonly ActivityLevel[] = [
  "sedentary",
  "light",
  "moderate",
  "active",
  "veryActive",
];

/** Mifflin-St Jeor sex adjustment in kcal per day. */
export const SEX_ADJUSTMENT: Record<Profile, number> = {
  female: -161,
  male: 5,
};

/** Standard activity multipliers applied to basal metabolic rate. */
export const ACTIVITY_MULTIPLIERS: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  veryActive: 1.9,
};

/** Daily energy gap used for the cut and gain reference rows. */
export const ENERGY_STEP = 500;

/** Adult inputs that keep the equation meaningful. */
const LIMITS = {
  age: [16, 100],
  height: [120, 220],
  weight: [30, 300],
} as const;

export interface TdeeInput {
  age: number;
  profile: Profile;
  height: number;
  weight: number;
  activity: ActivityLevel;
}

export const DEFAULTS: Pick<TdeeInput, "profile" | "activity"> = {
  profile: "male",
  activity: "moderate",
};

export type TdeeError = "INVALID_NUMBER" | "OUT_OF_RANGE";

export interface TdeeResult {
  bmr: number;
  factor: number;
  tdee: number;
  maintenance: number;
  cut: number;
  gain: number;
  bmrFormula: string;
  tdeeFormula: string;
  error?: TdeeError;
}

function fail(error: TdeeError): TdeeResult {
  return {
    bmr: 0,
    factor: 0,
    tdee: 0,
    maintenance: 0,
    cut: 0,
    gain: 0,
    bmrFormula: "",
    tdeeFormula: "",
    error,
  };
}

function inRange(value: number, [min, max]: readonly [number, number]): boolean {
  return value >= min && value <= max;
}

/**
 * Mifflin-St Jeor: BMR = 10 * kg + 6.25 * cm - 5 * age + sex adjustment.
 * Total daily energy expenditure is BMR times the chosen activity multiplier.
 */
export function calculateTdee(input: TdeeInput): TdeeResult {
  const { age, profile, height, weight, activity } = input;

  if (![age, height, weight].every((value) => Number.isFinite(value))) {
    return fail("INVALID_NUMBER");
  }

  if (
    !(profile in SEX_ADJUSTMENT) ||
    !(activity in ACTIVITY_MULTIPLIERS)
  ) {
    return fail("INVALID_NUMBER");
  }

  if (
    !inRange(age, LIMITS.age) ||
    !inRange(height, LIMITS.height) ||
    !inRange(weight, LIMITS.weight)
  ) {
    return fail("OUT_OF_RANGE");
  }

  const adjustment = SEX_ADJUSTMENT[profile];
  const factor = ACTIVITY_MULTIPLIERS[activity];
  const bmr = 10 * weight + 6.25 * height - 5 * age + adjustment;
  const tdee = bmr * factor;

  const adjustmentSign = adjustment >= 0 ? "+" : "-";
  const bmrFormula =
    `10 × ${weight} + 6.25 × ${height} - 5 × ${age} ` +
    `${adjustmentSign} ${Math.abs(adjustment)} = ${Math.round(bmr)}`;
  const tdeeFormula =
    `${Math.round(bmr)} × ${factor} = ${Math.round(tdee)}`;

  return {
    bmr,
    factor,
    tdee,
    maintenance: tdee,
    cut: tdee - ENERGY_STEP,
    gain: tdee + ENERGY_STEP,
    bmrFormula,
    tdeeFormula,
  };
}

export interface TdeeReportLabels {
  title: string;
  bmr: string;
  factor: string;
  tdee: string;
  maintenance: string;
  cut: string;
  gain: string;
  formula: string;
  unit: string;
  note: string;
}

/** Plain-text report for clipboard and download. Numbers are rounded here. */
export function formatTdeeReport(
  result: TdeeResult,
  labels: TdeeReportLabels,
): string {
  const kcal = (value: number) => `${Math.round(value)} ${labels.unit}`;
  return [
    labels.title,
    `${labels.bmr}: ${kcal(result.bmr)}`,
    `${labels.factor}: ${result.factor}`,
    `${labels.tdee}: ${kcal(result.tdee)}`,
    `${labels.maintenance}: ${kcal(result.maintenance)}`,
    `${labels.cut}: ${kcal(result.cut)}`,
    `${labels.gain}: ${kcal(result.gain)}`,
    `${labels.formula}: ${result.bmrFormula}; ${result.tdeeFormula}`,
    labels.note,
  ].join("\n");
}
