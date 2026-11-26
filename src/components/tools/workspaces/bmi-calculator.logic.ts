/** Pure BMI arithmetic. No DOM, React or locale formatting. */

export type UnitSystem = "metric" | "imperial";

export const UNIT_SYSTEMS: readonly UnitSystem[] = ["metric", "imperial"];

export type BmiCategory = "underweight" | "healthy" | "overweight" | "obese";

export const BMI_CATEGORIES: readonly BmiCategory[] = [
  "underweight",
  "healthy",
  "overweight",
  "obese",
];

export type BmiErrorCode = "INVALID_NUMBER" | "OUT_OF_RANGE";

/** Weight and height bounds keep the result meaningful for adults. */
const LIMITS: Record<UnitSystem, { weight: [number, number]; height: [number, number] }> = {
  metric: { weight: [1, 400], height: [50, 250] },
  imperial: { weight: [2, 900], height: [20, 100] },
};

export const DEFAULTS: { system: UnitSystem; weight: number; height: number } = {
  system: "metric",
  weight: 70,
  height: 175,
};

function round1(value: number): number {
  return Math.round((value + Number.EPSILON) * 10) / 10;
}

/** World Health Organization adult cutoffs, applied to the displayed BMI. */
export function categoryFor(bmi: number): BmiCategory {
  if (bmi < 18.5) return "underweight";
  if (bmi < 25) return "healthy";
  if (bmi < 30) return "overweight";
  return "obese";
}

/** Weight span for a BMI from 18.5 up to 25, in the current weight unit. */
export function healthyWeightRange(
  height: number,
  system: UnitSystem,
): { min: number; max: number } {
  if (system === "metric") {
    const metres = height / 100;
    return { min: round1(18.5 * metres * metres), max: round1(25 * metres * metres) };
  }
  const inchesSquared = height * height;
  return {
    min: round1((18.5 * inchesSquared) / 703),
    max: round1((25 * inchesSquared) / 703),
  };
}

export interface BmiResult {
  bmi: number;
  category: BmiCategory;
  formula: string;
  healthyWeight: { min: number; max: number };
  error?: { code: BmiErrorCode };
}

function fail(code: BmiErrorCode): BmiResult {
  return {
    bmi: 0,
    category: "healthy",
    formula: "",
    healthyWeight: { min: 0, max: 0 },
    error: { code },
  };
}

/** Calculate BMI from weight and height in the selected unit system. */
export function calculateBmi(
  weight: number,
  height: number,
  system: UnitSystem,
): BmiResult {
  if (!Number.isFinite(weight) || !Number.isFinite(height) || weight <= 0 || height <= 0) {
    return fail("INVALID_NUMBER");
  }

  const limits = LIMITS[system];
  if (
    weight < limits.weight[0] || weight > limits.weight[1] ||
    height < limits.height[0] || height > limits.height[1]
  ) {
    return fail("OUT_OF_RANGE");
  }

  const bmi = system === "metric"
    ? weight / ((height / 100) * (height / 100))
    : (703 * weight) / (height * height);
  const rounded = round1(bmi);

  return {
    bmi: rounded,
    category: categoryFor(rounded),
    formula: system === "metric"
      ? `${weight} / (${height / 100} * ${height / 100}) = ${rounded}`
      : `703 * ${weight} / (${height} * ${height}) = ${rounded}`,
    healthyWeight: healthyWeightRange(height, system),
  };
}

export interface BmiReportLabels {
  title: string;
  bmi: string;
  category: string;
  healthy: string;
  formula: string;
  note: string;
  unit: string;
}

/** Render the calculation as a plain-text report for clipboard and download. */
export function formatBmiReport(
  result: BmiResult,
  categoryLabel: string,
  labels: BmiReportLabels,
): string {
  return [
    labels.title,
    `${labels.bmi}: ${result.bmi.toFixed(1)}`,
    `${labels.category}: ${categoryLabel}`,
    `${labels.healthy}: ${result.healthyWeight.min.toFixed(1)} - ${result.healthyWeight.max.toFixed(1)} ${labels.unit}`,
    `${labels.formula}: ${result.formula}`,
    labels.note,
  ].join("\n");
}
