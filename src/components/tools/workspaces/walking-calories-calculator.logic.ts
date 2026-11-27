/** Pure arithmetic for a walking or running calorie estimate. No DOM, React or locale formatting. */

export type ActivityMode = "walk" | "run";
export type InputMode = "distance" | "duration";
export type WeightUnit = "kg" | "lb";
export type DistanceUnit = "km" | "mi";

export const KM_PER_MI = 1.609344;
export const KG_PER_LB = 0.45359237;

export const ACTIVITY_MODES: readonly ActivityMode[] = ["walk", "run"];
export const INPUT_MODES: readonly InputMode[] = ["distance", "duration"];
export const WEIGHT_UNITS: readonly WeightUnit[] = ["kg", "lb"];
export const DISTANCE_UNITS: readonly DistanceUnit[] = ["km", "mi"];

export const DEFAULTS = {
  activity: "walk" as ActivityMode,
  mode: "distance" as InputMode,
  weightUnit: "kg" as WeightUnit,
  distanceUnit: "km" as DistanceUnit,
  weightKg: 70,
  weightLb: 154,
  distanceKm: 5,
  distanceMi: 3.1,
  paceKm: 12,
  paceMi: 19,
  minutes: 60,
};

const WEIGHT_RANGE: Record<WeightUnit, [number, number]> = {
  kg: [1, 400],
  lb: [2, 900],
};
const DISTANCE_RANGE: Record<DistanceUnit, [number, number]> = {
  km: [0.1, 100],
  mi: [0.1, 62],
};
const PACE_RANGE: Record<DistanceUnit, [number, number]> = {
  km: [2, 60],
  mi: [3.2, 96.6],
};
const MINUTES_RANGE: [number, number] = [1, 1440];

/** MET lookup points for walking and running, interpolated between entries. */
const WALK_MET: readonly [number, number][] = [
  [3, 2.8],
  [4, 3.5],
  [5, 4.3],
  [6, 5],
  [7, 6],
  [8, 8],
];
const RUN_MET: readonly [number, number][] = [
  [6, 6.5],
  [8, 8],
  [9, 9],
  [10, 9.8],
  [11, 10.8],
  [12, 11.5],
  [14, 13.5],
  [16, 15],
];

export type WalkErrorCode = "INVALID_NUMBER" | "OUT_OF_RANGE";

export interface WalkInput {
  activity: ActivityMode;
  mode: InputMode;
  weightUnit: WeightUnit;
  weight: number;
  distanceUnit: DistanceUnit;
  distance: number;
  pace: number;
  minutes: number;
}

export interface WalkResult {
  error?: { code: WalkErrorCode };
  weightKg: number;
  minutes: number;
  distanceKm: number;
  speedKmh: number;
  paceMinPerKm: number;
  met: number;
  kcal: number;
}

function fail(code: WalkErrorCode): WalkResult {
  return {
    weightKg: 0,
    minutes: 0,
    distanceKm: 0,
    speedKmh: 0,
    paceMinPerKm: 0,
    met: 0,
    kcal: 0,
    error: { code },
  };
}

function round1(value: number): number {
  return Math.round((value + Number.EPSILON) * 10) / 10;
}

function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

/** Convert a weight between kilograms and pounds. */
export function convertWeight(value: number, from: WeightUnit, to: WeightUnit): number {
  if (from === to) return value;
  return from === "kg" ? value / KG_PER_LB : value * KG_PER_LB;
}

/** Convert a distance between kilometres and miles. */
export function convertDistance(value: number, from: DistanceUnit, to: DistanceUnit): number {
  if (from === to) return value;
  return from === "km" ? value / KM_PER_MI : value * KM_PER_MI;
}

/** Convert a pace in minutes per mile to minutes per kilometre, or back. */
export function convertPace(value: number, from: DistanceUnit, to: DistanceUnit): number {
  if (from === to) return value;
  return from === "km" ? value * KM_PER_MI : value / KM_PER_MI;
}

/** Interpolate a MET value from a speed in kilometres per hour. */
export function metForSpeed(speedKmh: number, activity: ActivityMode): number {
  const table = activity === "walk" ? WALK_MET : RUN_MET;
  if (speedKmh <= table[0][0]) return table[0][1];
  const last = table[table.length - 1];
  if (speedKmh >= last[0]) return last[1];
  for (let index = 1; index < table.length; index += 1) {
    const [highSpeed, highMet] = table[index];
    if (speedKmh > highSpeed) continue;
    const [lowSpeed, lowMet] = table[index - 1];
    const ratio = (speedKmh - lowSpeed) / (highSpeed - lowSpeed);
    return round1(lowMet + ratio * (highMet - lowMet));
  }
  return last[1];
}

/**
 * Estimate gross energy burn with the MET method:
 * kcal = MET x weight in kilograms x hours. Pace sets the speed used for MET,
 * and distance or duration fills in whichever value the user did not enter.
 */
export function calculateWalk(input: WalkInput): WalkResult {
  const { activity, mode, weightUnit, weight, distanceUnit, distance, pace, minutes } = input;

  const hasBadNumber =
    !Number.isFinite(weight) || weight <= 0 ||
    !Number.isFinite(pace) || pace <= 0 ||
    (mode === "distance"
      ? !Number.isFinite(distance) || distance <= 0
      : !Number.isFinite(minutes) || minutes <= 0);
  if (hasBadNumber) return fail("INVALID_NUMBER");

  const [minWeight, maxWeight] = WEIGHT_RANGE[weightUnit];
  const [minDistance, maxDistance] = DISTANCE_RANGE[distanceUnit];
  const [minPace, maxPace] = PACE_RANGE[distanceUnit];
  const outOfRange =
    weight < minWeight || weight > maxWeight ||
    pace < minPace || pace > maxPace ||
    (mode === "distance"
      ? distance < minDistance || distance > maxDistance
      : minutes < MINUTES_RANGE[0] || minutes > MINUTES_RANGE[1]);
  if (outOfRange) return fail("OUT_OF_RANGE");

  const weightKg = weightUnit === "kg" ? weight : weight * KG_PER_LB;
  const paceMinPerKm = convertPace(pace, distanceUnit, "km");
  const speedKmh = 60 / paceMinPerKm;
  const totalMinutes = mode === "distance" ? distance * pace : minutes;
  const distanceKm = mode === "distance"
    ? convertDistance(distance, distanceUnit, "km")
    : (totalMinutes / paceMinPerKm);
  const met = metForSpeed(speedKmh, activity);
  const kcal = Math.round(met * weightKg * (totalMinutes / 60));

  return {
    weightKg: round1(weightKg),
    minutes: Math.round(totalMinutes),
    distanceKm: round2(distanceKm),
    speedKmh: round1(speedKmh),
    paceMinPerKm: round1(paceMinPerKm),
    met,
    kcal,
  };
}

export interface WalkReportLabels {
  title: string;
  weight: string;
  activity: string;
  duration: string;
  distance: string;
  pace: string;
  speed: string;
  met: string;
  burn: string;
  note: string;
  unitKg: string;
  unitLb: string;
  unitKm: string;
  unitMi: string;
  unitMin: string;
  unitKcal: string;
  unitMet: string;
  unitSpeed: string;
  walk: string;
  run: string;
}

/** Render the estimate as plain text for clipboard use. */
export function formatWalkReport(
  result: WalkResult,
  input: WalkInput,
  labels: WalkReportLabels,
): string {
  const weightUnit = input.weightUnit === "kg" ? labels.unitKg : labels.unitLb;
  const distanceUnit = input.distanceUnit === "km" ? labels.unitKm : labels.unitMi;
  const activity = input.activity === "walk" ? labels.walk : labels.run;
  const shownDistance = input.mode === "distance"
    ? input.distance
    : convertDistance(result.distanceKm, "km", input.distanceUnit);

  return [
    labels.title,
    `${labels.weight}: ${input.weight} ${weightUnit}`,
    `${labels.activity}: ${activity}`,
    `${labels.duration}: ${result.minutes} ${labels.unitMin}`,
    `${labels.distance}: ${round2(shownDistance)} ${distanceUnit}`,
    `${labels.pace}: ${input.pace} ${labels.unitMin}/${distanceUnit}`,
    `${labels.speed}: ${result.speedKmh} ${labels.unitSpeed}`,
    `${labels.met}: ${result.met} ${labels.unitMet}`,
    `${labels.burn}: ${result.kcal} ${labels.unitKcal}`,
    labels.note,
  ].join("\n");
}
