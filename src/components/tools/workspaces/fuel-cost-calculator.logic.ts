/** Pure trip fuel arithmetic with fixed conversion factors. No DOM, React or formatting. */

export type DistanceUnit = "km" | "mi";
export type EfficiencyUnit = "kmpl" | "lp100" | "mpgUs" | "mpgUk";
export type FuelPriceUnit = "liter" | "usGallon" | "imperialGallon";

export const KM_PER_MILE = 1.609344;
export const LITERS_PER_US_GALLON = 3.785411784;
export const LITERS_PER_IMPERIAL_GALLON = 4.54609;
export const MPG_US_TO_KMPL = 0.425144;
export const MPG_UK_TO_KMPL = 0.354006;

export interface FuelCostInput {
  distance: string;
  distanceUnit: DistanceUnit;
  efficiencyUnit: EfficiencyUnit;
  efficiency: string;
  price: string;
  roundTrip: boolean;
  split: string;
}

export type FuelErrorCode =
  | "MISSING_DISTANCE"
  | "MISSING_EFFICIENCY"
  | "MISSING_PRICE"
  | "MISSING_SPLIT"
  | "INVALID_NUMBER"
  | "NOT_POSITIVE"
  | "INVALID_SPLIT";

export interface FuelEstimate {
  distanceKm: number;
  kmPerLiter: number;
  litersNeeded: number;
  gallonsNeeded: number;
  priceUnit: FuelPriceUnit;
  litersPerPriceUnit: number;
  priceUnitsNeeded: number;
  cost: number;
  costPerPerson: number;
  costPerKm: number;
  splitCount: number;
  roundTrip: boolean;
}

export interface FuelCostResult {
  value?: FuelEstimate;
  error?: { code: FuelErrorCode };
}

export const DEFAULTS: FuelCostInput = {
  distance: "240",
  distanceUnit: "km",
  efficiencyUnit: "lp100",
  efficiency: "7.5",
  price: "1.85",
  roundTrip: false,
  split: "2",
};

/** Null means the field is empty, NaN means it is not a finite number. */
function parse(raw: string): number | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const value = Number(trimmed);
  return Number.isFinite(value) ? value : Number.NaN;
}

/** The price unit always follows the efficiency unit the viewer selected. */
export function priceUnitFor(unit: EfficiencyUnit): FuelPriceUnit {
  if (unit === "mpgUs") return "usGallon";
  if (unit === "mpgUk") return "imperialGallon";
  return "liter";
}

export function litersPerPriceUnit(unit: FuelPriceUnit): number {
  if (unit === "usGallon") return LITERS_PER_US_GALLON;
  if (unit === "imperialGallon") return LITERS_PER_IMPERIAL_GALLON;
  return 1;
}

/** One consistent efficiency figure so all four input units can be compared. */
export function toKilometersPerLiter(value: number, unit: EfficiencyUnit): number {
  if (unit === "kmpl") return value;
  if (unit === "lp100") return 100 / value;
  if (unit === "mpgUs") return value * MPG_US_TO_KMPL;
  return value * MPG_UK_TO_KMPL;
}

export function calculateFuelCost(input: FuelCostInput): FuelCostResult {
  const distance = parse(input.distance);
  const efficiency = parse(input.efficiency);
  const price = parse(input.price);
  const split = parse(input.split);

  if (distance === null) return { error: { code: "MISSING_DISTANCE" } };
  if (efficiency === null) return { error: { code: "MISSING_EFFICIENCY" } };
  if (price === null) return { error: { code: "MISSING_PRICE" } };
  if (split === null) return { error: { code: "MISSING_SPLIT" } };

  const numbers = [distance, efficiency, price, split];
  if (numbers.some((value) => Number.isNaN(value))) {
    return { error: { code: "INVALID_NUMBER" } };
  }
  if (distance <= 0 || efficiency <= 0 || price <= 0) {
    return { error: { code: "NOT_POSITIVE" } };
  }
  if (!Number.isInteger(split) || split < 1) {
    return { error: { code: "INVALID_SPLIT" } };
  }

  const oneWayKm = input.distanceUnit === "mi" ? distance * KM_PER_MILE : distance;
  const distanceKm = input.roundTrip ? oneWayKm * 2 : oneWayKm;
  const kmPerLiter = toKilometersPerLiter(efficiency, input.efficiencyUnit);
  const litersNeeded = distanceKm / kmPerLiter;
  const priceUnit = priceUnitFor(input.efficiencyUnit);
  const litersPerUnit = litersPerPriceUnit(priceUnit);
  const priceUnitsNeeded = litersNeeded / litersPerUnit;
  const cost = priceUnitsNeeded * price;

  return {
    value: {
      distanceKm,
      kmPerLiter,
      litersNeeded,
      gallonsNeeded: litersNeeded / LITERS_PER_US_GALLON,
      priceUnit,
      litersPerPriceUnit: litersPerUnit,
      priceUnitsNeeded,
      cost,
      costPerPerson: cost / split,
      costPerKm: cost / distanceKm,
      splitCount: split,
      roundTrip: input.roundTrip,
    },
  };
}

export interface FuelReportLabels {
  title: string;
  distance: string;
  efficiency: string;
  price: string;
  roundTrip: string;
  split: string;
  fuel: string;
  cost: string;
  perPerson: string;
  perKm: string;
  note: string;
  roundTripOn: string;
  roundTripOff: string;
}

/** Render the estimate as plain text for clipboard use. */
export function formatFuelReport(
  estimate: FuelEstimate,
  input: FuelCostInput,
  labels: FuelReportLabels,
  distanceUnitLabel: string,
  efficiencyUnitLabel: string,
  priceUnitLabel: string,
  format: (value: number) => string,
): string {
  return [
    labels.title,
    `${labels.distance}: ${input.distance.trim()} ${distanceUnitLabel}`,
    `${labels.efficiency}: ${input.efficiency.trim()} ${efficiencyUnitLabel}`,
    `${labels.price}: ${format(Number(input.price) || 0)} ${priceUnitLabel}`,
    `${labels.roundTrip}: ${estimate.roundTrip ? labels.roundTripOn : labels.roundTripOff}`,
    `${labels.split}: ${estimate.splitCount}`,
    `${labels.fuel}: ${format(estimate.litersNeeded)} L`,
    `${labels.cost}: ${format(estimate.cost)}`,
    `${labels.perPerson}: ${format(estimate.costPerPerson)}`,
    `${labels.perKm}: ${format(estimate.costPerKm)}`,
    labels.note,
  ].join("\n");
}
