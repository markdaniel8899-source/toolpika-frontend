/** Pure drink energy arithmetic with a small bundled serving table. No DOM, React or locale formatting. */

export type DrinkCategory = "soft" | "juice" | "energy" | "smoothie" | "alcohol";
export type DrinkErrorCode = "INVALID_OPTION" | "INVALID_NUMBER" | "OUT_OF_RANGE";

export interface Drink {
  id: string;
  category: DrinkCategory;
  kcalPer100Ml: number;
  typicalMl: number;
}

export const DRINK_CATEGORIES: readonly DrinkCategory[] = [
  "soft",
  "juice",
  "energy",
  "smoothie",
  "alcohol",
];

/** Typical calories per 100 ml and a common serving for each drink. */
export const DRINKS: readonly Drink[] = [
  { id: "cola", category: "soft", kcalPer100Ml: 43, typicalMl: 330 },
  { id: "lemonSoda", category: "soft", kcalPer100Ml: 42, typicalMl: 330 },
  { id: "sweetIcedTea", category: "soft", kcalPer100Ml: 42, typicalMl: 355 },
  { id: "orangeJuice", category: "juice", kcalPer100Ml: 45, typicalMl: 250 },
  { id: "appleJuice", category: "juice", kcalPer100Ml: 46, typicalMl: 250 },
  { id: "cranberryCocktail", category: "juice", kcalPer100Ml: 46, typicalMl: 250 },
  { id: "energyDrink", category: "energy", kcalPer100Ml: 45, typicalMl: 250 },
  { id: "sugarFreeEnergy", category: "energy", kcalPer100Ml: 2, typicalMl: 250 },
  { id: "sportsDrink", category: "energy", kcalPer100Ml: 25, typicalMl: 500 },
  { id: "fruitSmoothie", category: "smoothie", kcalPer100Ml: 65, typicalMl: 350 },
  { id: "berrySmoothie", category: "smoothie", kcalPer100Ml: 75, typicalMl: 350 },
  { id: "greenSmoothie", category: "smoothie", kcalPer100Ml: 55, typicalMl: 350 },
  { id: "beer", category: "alcohol", kcalPer100Ml: 43, typicalMl: 355 },
  { id: "redWine", category: "alcohol", kcalPer100Ml: 85, typicalMl: 150 },
  { id: "margarita", category: "alcohol", kcalPer100Ml: 110, typicalMl: 180 },
];

export const LIMITS = {
  servingMl: [50, 2000],
  count: [1, 50],
} as const;

export interface DrinkInput {
  category: DrinkCategory;
  drinkId: string;
  servingMl: number;
  count: number;
}

export const DEFAULT_DRINK_INPUT: DrinkInput = {
  category: "soft",
  drinkId: "cola",
  servingMl: 330,
  count: 1,
};

export interface DrinkResult {
  drink: Drink;
  kcalPerServing: number;
  totalKcal: number;
  error?: DrinkErrorCode;
}

function emptyResult(): DrinkResult {
  return {
    drink: DRINKS[0],
    kcalPerServing: 0,
    totalKcal: 0,
  };
}

export function drinksByCategory(category: DrinkCategory): readonly Drink[] {
  return DRINKS.filter((drink) => drink.category === category);
}

export function findDrink(id: string): Drink | undefined {
  return DRINKS.find((drink) => drink.id === id);
}

function inRange(value: number, [min, max]: readonly [number, number]): boolean {
  return value >= min && value <= max;
}

/**
 * Calories scale with the volume and the number of servings:
 * total = kcal per 100 ml x serving ml / 100 x servings.
 */
export function calculateDrink(input: DrinkInput): DrinkResult {
  const { category, drinkId, servingMl, count } = input;

  if (!DRINK_CATEGORIES.includes(category)) {
    return { ...emptyResult(), error: "INVALID_OPTION" };
  }

  const drink = findDrink(drinkId);
  if (!drink || drink.category !== category) {
    return { ...emptyResult(), error: "INVALID_OPTION" };
  }

  if (!Number.isFinite(servingMl) || !Number.isFinite(count)) {
    return { ...emptyResult(), error: "INVALID_NUMBER" };
  }

  if (
    !inRange(servingMl, LIMITS.servingMl) ||
    !Number.isInteger(count) ||
    !inRange(count, LIMITS.count)
  ) {
    return { ...emptyResult(), error: "OUT_OF_RANGE" };
  }

  const kcalPerServing = (drink.kcalPer100Ml * servingMl) / 100;
  return {
    drink,
    kcalPerServing,
    totalKcal: kcalPerServing * count,
  };
}

export interface DrinkReportLabels {
  title: string;
  drink: string;
  category: string;
  per100: string;
  serving: string;
  count: string;
  perServing: string;
  total: string;
  breakdown: string;
  unitMl: string;
  unitKcal: string;
  note: string;
}

/** Plain-text breakdown for the clipboard button. Numbers are rounded here. */
export function formatDrinkReport(
  result: DrinkResult,
  input: DrinkInput,
  drinkName: string,
  categoryLabel: string,
  labels: DrinkReportLabels,
): string {
  if (result.error) return "";
  return [
    labels.title,
    `${labels.drink}: ${drinkName}`,
    `${labels.category}: ${categoryLabel}`,
    "",
    labels.breakdown,
    `${labels.per100}: ${result.drink.kcalPer100Ml} ${labels.unitKcal}`,
    `${labels.serving}: ${input.servingMl} ${labels.unitMl}`,
    `${labels.count}: ${input.count}`,
    `${labels.perServing}: ${Math.round(result.kcalPerServing)} ${labels.unitKcal}`,
    `${labels.total}: ${Math.round(result.totalKcal)} ${labels.unitKcal}`,
    "",
    labels.note,
  ].join("\n");
}
