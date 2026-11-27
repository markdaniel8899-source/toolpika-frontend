/** Pure kitchen unit and ingredient-density arithmetic. No DOM, React or side effects. */

export type VolumeUnit = "cup" | "tbsp" | "tsp" | "flOz";
export type WeightUnit = "g" | "kg" | "oz";
export type ConverterUnit = VolumeUnit | WeightUnit;

export const CONVERTER_UNITS: readonly ConverterUnit[] = [
  "cup",
  "tbsp",
  "tsp",
  "flOz",
  "g",
  "kg",
  "oz",
];

export type IngredientId =
  | "water"
  | "broth"
  | "milk"
  | "flour"
  | "sugar"
  | "brownSugar"
  | "rice"
  | "butter"
  | "oats";

export const INGREDIENT_IDS: readonly IngredientId[] = [
  "water",
  "broth",
  "milk",
  "flour",
  "sugar",
  "brownSugar",
  "rice",
  "butter",
  "oats",
];

/** Milliliters in each volume unit. */
export const ML_PER_UNIT: Record<VolumeUnit, number> = {
  cup: 240,
  tbsp: 15,
  tsp: 5,
  flOz: 30,
};

/** Grams in each weight unit. */
export const GRAMS_PER_UNIT: Record<WeightUnit, number> = {
  g: 1,
  kg: 1000,
  oz: 28.349523125,
};

/** Grams of each ingredient in one 240 ml cup. */
export const GRAMS_PER_CUP: Record<IngredientId, number> = {
  water: 240,
  broth: 240,
  milk: 240,
  flour: 120,
  sugar: 200,
  brownSugar: 220,
  rice: 185,
  butter: 227,
  oats: 90,
};

export type ConversionKind =
  | "volumeToVolume"
  | "weightToWeight"
  | "volumeToWeight"
  | "weightToVolume";

export type ConverterErrorCode =
  | "MISSING_AMOUNT"
  | "INVALID_AMOUNT"
  | "NEGATIVE_AMOUNT";

export interface CookingConverterInput {
  amount: string;
  from: ConverterUnit;
  to: ConverterUnit;
  ingredient: IngredientId;
}

export interface CookingConverterValue {
  amount: number;
  result: number;
  fromUnit: ConverterUnit;
  toUnit: ConverterUnit;
  ingredient: IngredientId;
  kind: ConversionKind;
  fromMl: number;
  gramsPerCup: number;
}

export interface CookingConverterResult {
  value?: CookingConverterValue;
  error?: { code: ConverterErrorCode };
}

export function parseAmount(raw: string): number | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const value = Number(trimmed);
  return Number.isFinite(value) ? value : null;
}

export function isVolumeUnit(unit: ConverterUnit): unit is VolumeUnit {
  return unit === "cup" || unit === "tbsp" || unit === "tsp" || unit === "flOz";
}

export function isWeightUnit(unit: ConverterUnit): unit is WeightUnit {
  return unit === "g" || unit === "kg" || unit === "oz";
}

export function conversionKind(
  from: ConverterUnit,
  to: ConverterUnit,
): ConversionKind {
  if (isVolumeUnit(from)) {
    return isVolumeUnit(to) ? "volumeToVolume" : "volumeToWeight";
  }
  return isWeightUnit(to) ? "weightToWeight" : "weightToVolume";
}

function tidy(value: number): number {
  return Math.round(value * 1e9) / 1e9;
}

/** Convert any amount between kitchen units, using density when crossing kinds. */
export function convertAmount(
  amount: number,
  from: ConverterUnit,
  to: ConverterUnit,
  ingredient: IngredientId,
): number {
  const kind = conversionKind(from, to);
  let inMilliliters = 0;
  let inGrams = 0;

  if (isVolumeUnit(from)) {
    inMilliliters = amount * ML_PER_UNIT[from];
  } else {
    inGrams = amount * GRAMS_PER_UNIT[from];
  }

  if (kind === "volumeToVolume") {
    return tidy(inMilliliters / ML_PER_UNIT[to as VolumeUnit]);
  }
  if (kind === "weightToWeight") {
    return tidy(inGrams / GRAMS_PER_UNIT[to as WeightUnit]);
  }

  const gramsPerCup = GRAMS_PER_CUP[ingredient];
  if (kind === "volumeToWeight") {
    const grams = (inMilliliters / 240) * gramsPerCup;
    return tidy(grams / GRAMS_PER_UNIT[to as WeightUnit]);
  }

  const milliliters = (inGrams / gramsPerCup) * 240;
  return tidy(milliliters / ML_PER_UNIT[to as VolumeUnit]);
}

export function calculateConversion(
  input: CookingConverterInput,
): CookingConverterResult {
  if (!input.amount.trim()) return { error: { code: "MISSING_AMOUNT" } };
  const amount = parseAmount(input.amount);
  if (amount === null) return { error: { code: "INVALID_AMOUNT" } };
  if (amount < 0) return { error: { code: "NEGATIVE_AMOUNT" } };

  const kind = conversionKind(input.from, input.to);
  return {
    value: {
      amount,
      result: convertAmount(amount, input.from, input.to, input.ingredient),
      fromUnit: input.from,
      toUnit: input.to,
      ingredient: input.ingredient,
      kind,
      fromMl: isVolumeUnit(input.from)
        ? amount * ML_PER_UNIT[input.from]
        : (amount * GRAMS_PER_UNIT[input.from] * 240) /
          GRAMS_PER_CUP[input.ingredient],
      gramsPerCup: GRAMS_PER_CUP[input.ingredient],
    },
  };
}

export interface ConversionReportLabels {
  title: string;
  amount: string;
  from: string;
  to: string;
  ingredient: string;
  reference: string;
  density: string;
  type: string;
  perCup: string;
  gramUnit: string;
  units: Record<ConverterUnit, string>;
  ingredients: Record<IngredientId, string>;
  kinds: Record<ConversionKind, string>;
}

/** Render the conversion as plain text for clipboard use. */
export function formatConversionReport(
  value: CookingConverterValue,
  labels: ConversionReportLabels,
  format: (value: number) => string,
): string {
  const reference = convertAmount(1, value.fromUnit, value.toUnit, value.ingredient);
  return [
    labels.title,
    `${labels.amount}: ${format(value.amount)} ${labels.units[value.fromUnit]}`,
    `${labels.from}: ${labels.units[value.fromUnit]}`,
    `${labels.to}: ${labels.units[value.toUnit]}`,
    `${labels.ingredient}: ${labels.ingredients[value.ingredient]}`,
    `${labels.reference}: 1 ${labels.units[value.fromUnit]} = ${format(reference)} ${labels.units[value.toUnit]}`,
    `${labels.density}: ${format(value.gramsPerCup)} ${labels.gramUnit} ${labels.perCup}`,
    `${labels.type}: ${labels.kinds[value.kind]}`,
  ].join("\n");
}
