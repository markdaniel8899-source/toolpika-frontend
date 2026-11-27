/** Pure coffee drink arithmetic. No DOM, React or locale formatting. */

export type DrinkBase =
  | "espresso"
  | "brewed"
  | "coldBrew"
  | "latte"
  | "cappuccino"
  | "mocha";

export type CupSize = "small" | "medium" | "large";

export type Milk = "none" | "whole" | "skim" | "oat" | "almond";

export type CoffeePartId =
  | "coffee"
  | "milk"
  | "chocolate"
  | "syrup"
  | "sugar"
  | "cream";

export type CoffeeErrorCode = "INVALID_OPTION" | "INVALID_NUMBER" | "OUT_OF_RANGE";

export interface Macros {
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface CoffeeInput {
  base: DrinkBase;
  size: CupSize;
  milk: Milk;
  syrup: number;
  sugar: number;
  whipped: boolean;
}

export const DRINK_BASES: readonly DrinkBase[] = [
  "espresso",
  "brewed",
  "coldBrew",
  "latte",
  "cappuccino",
  "mocha",
];

export const CUP_SIZES: readonly CupSize[] = ["small", "medium", "large"];

export const MILKS: readonly Milk[] = ["none", "whole", "skim", "oat", "almond"];

export const COFFEE_PARTS: readonly CoffeePartId[] = [
  "coffee",
  "milk",
  "chocolate",
  "syrup",
  "sugar",
  "cream",
];

export const DEFAULT_COFFEE_INPUT: CoffeeInput = {
  base: "brewed",
  size: "medium",
  milk: "none",
  syrup: 0,
  sugar: 0,
  whipped: false,
};

/** Energy values for the coffee and flavouring portion only, before milk. */
const COFFEE: Record<DrinkBase, Record<CupSize, Macros>> = {
  espresso: {
    small: { kcal: 5, protein: 0.3, carbs: 1, fat: 0 },
    medium: { kcal: 10, protein: 0.6, carbs: 2, fat: 0 },
    large: { kcal: 15, protein: 0.9, carbs: 3, fat: 0 },
  },
  brewed: {
    small: { kcal: 2, protein: 0, carbs: 0, fat: 0 },
    medium: { kcal: 3, protein: 0, carbs: 0.5, fat: 0 },
    large: { kcal: 5, protein: 0, carbs: 1, fat: 0 },
  },
  coldBrew: {
    small: { kcal: 5, protein: 0, carbs: 0, fat: 0 },
    medium: { kcal: 8, protein: 0, carbs: 1, fat: 0 },
    large: { kcal: 12, protein: 0, carbs: 2, fat: 0 },
  },
  latte: {
    small: { kcal: 5, protein: 0.3, carbs: 1, fat: 0 },
    medium: { kcal: 10, protein: 0.6, carbs: 2, fat: 0 },
    large: { kcal: 15, protein: 0.9, carbs: 3, fat: 0 },
  },
  cappuccino: {
    small: { kcal: 5, protein: 0.3, carbs: 1, fat: 0 },
    medium: { kcal: 10, protein: 0.6, carbs: 2, fat: 0 },
    large: { kcal: 15, protein: 0.9, carbs: 3, fat: 0 },
  },
  mocha: {
    small: { kcal: 5, protein: 0.3, carbs: 1, fat: 0 },
    medium: { kcal: 10, protein: 0.6, carbs: 2, fat: 0 },
    large: { kcal: 15, protein: 0.9, carbs: 3, fat: 0 },
  },
};

/** Chocolate flavouring that only a mocha contains. */
const CHOCOLATE: Record<CupSize, Macros> = {
  small: { kcal: 90, protein: 1, carbs: 20, fat: 2 },
  medium: { kcal: 110, protein: 2, carbs: 25, fat: 3 },
  large: { kcal: 140, protein: 2, carbs: 32, fat: 4 },
};

/** Milk servings scaled by cup size. One serving is about 180 ml. */
const MILK_SERVINGS: Record<DrinkBase, Record<CupSize, number>> = {
  espresso: { small: 0.2, medium: 0.3, large: 0.4 },
  brewed: { small: 0.3, medium: 0.5, large: 0.7 },
  coldBrew: { small: 0.3, medium: 0.5, large: 0.7 },
  latte: { small: 1, medium: 1.5, large: 2 },
  cappuccino: { small: 0.7, medium: 1, large: 1.4 },
  mocha: { small: 1, medium: 1.5, large: 2 },
};

/** Typical values for one 180 ml milk serving. */
export const MILK_MACROS: Record<Milk, Macros> = {
  none: { kcal: 0, protein: 0, carbs: 0, fat: 0 },
  whole: { kcal: 110, protein: 6, carbs: 9, fat: 6 },
  skim: { kcal: 65, protein: 6, carbs: 9, fat: 0 },
  oat: { kcal: 80, protein: 2, carbs: 13, fat: 4 },
  almond: { kcal: 30, protein: 1, carbs: 2, fat: 3 },
};

const SYRUP_PER_PUMP: Macros = { kcal: 20, protein: 0, carbs: 5, fat: 0 };
const SUGAR_PER_TSP: Macros = { kcal: 16, protein: 0, carbs: 4, fat: 0 };
const CREAM_DOLLOP: Macros = { kcal: 60, protein: 1, carbs: 1, fat: 6 };

const MAX_ADDITIONS = 100;

function emptyMacros(): Macros {
  return { kcal: 0, protein: 0, carbs: 0, fat: 0 };
}

function scale(value: Macros, factor: number): Macros {
  return {
    kcal: value.kcal * factor,
    protein: value.protein * factor,
    carbs: value.carbs * factor,
    fat: value.fat * factor,
  };
}

function sum(values: readonly Macros[]): Macros {
  return values.reduce<Macros>((total, value) => ({
    kcal: total.kcal + value.kcal,
    protein: total.protein + value.protein,
    carbs: total.carbs + value.carbs,
    fat: total.fat + value.fat,
  }), emptyMacros());
}

export function validateCoffeeInput(input: CoffeeInput): CoffeeErrorCode | null {
  if (
    !DRINK_BASES.includes(input.base) ||
    !CUP_SIZES.includes(input.size) ||
    !MILKS.includes(input.milk)
  ) {
    return "INVALID_OPTION";
  }
  if (!Number.isFinite(input.syrup) || !Number.isFinite(input.sugar)) {
    return "INVALID_NUMBER";
  }
  if (
    !Number.isInteger(input.syrup) || !Number.isInteger(input.sugar) ||
    input.syrup < 0 || input.syrup > MAX_ADDITIONS ||
    input.sugar < 0 || input.sugar > MAX_ADDITIONS
  ) {
    return "OUT_OF_RANGE";
  }
  return null;
}

export interface CoffeeResult {
  macros: Macros;
  parts: { id: CoffeePartId; macros: Macros }[];
  error?: { code: CoffeeErrorCode };
}

/** Add the coffee portion, milk, chocolate, syrup, sugar and cream. */
export function calculateCoffee(input: CoffeeInput): CoffeeResult {
  const problem = validateCoffeeInput(input);
  if (problem) {
    return { macros: emptyMacros(), parts: [], error: { code: problem } };
  }

  const milkServings = MILK_SERVINGS[input.base][input.size];
  const coffee = COFFEE[input.base][input.size];
  const milk = scale(MILK_MACROS[input.milk], milkServings);
  const chocolate = input.base === "mocha" ? CHOCOLATE[input.size] : emptyMacros();
  const syrup = scale(SYRUP_PER_PUMP, input.syrup);
  const sugar = scale(SUGAR_PER_TSP, input.sugar);
  const cream = input.whipped ? CREAM_DOLLOP : emptyMacros();

  const parts = [
    { id: "coffee" as const, macros: coffee },
    { id: "milk" as const, macros: milk },
    { id: "chocolate" as const, macros: chocolate },
    { id: "syrup" as const, macros: syrup },
    { id: "sugar" as const, macros: sugar },
    { id: "cream" as const, macros: cream },
  ];

  return { macros: sum(parts.map((part) => part.macros)), parts };
}

/** Share of macro energy for each bar: protein and carbs give 4 kcal/g, fat 9. */
export function macroShares(macros: Macros): { protein: number; carbs: number; fat: number } {
  const proteinKcal = macros.protein * 4;
  const carbsKcal = macros.carbs * 4;
  const fatKcal = macros.fat * 9;
  const total = proteinKcal + carbsKcal + fatKcal;
  if (total <= 0) return { protein: 0, carbs: 0, fat: 0 };
  const share = (value: number) => Math.max(0, Math.min(100, Math.round((value / total) * 100)));
  return { protein: share(proteinKcal), carbs: share(carbsKcal), fat: share(fatKcal) };
}

export interface CoffeeReportLabels {
  title: string;
  calories: string;
  protein: string;
  carbs: string;
  fat: string;
  breakdown: string;
  parts: Record<CoffeePartId, string>;
  note: string;
}

/** Plain text breakdown for the clipboard button. */
export function formatCoffeeReport(result: CoffeeResult, labels: CoffeeReportLabels): string {
  if (result.error) return "";
  const lines = [
    labels.title,
    `${labels.calories}: ${Math.round(result.macros.kcal)}`,
    `${labels.protein}: ${result.macros.protein.toFixed(1)} g`,
    `${labels.carbs}: ${result.macros.carbs.toFixed(1)} g`,
    `${labels.fat}: ${result.macros.fat.toFixed(1)} g`,
    "",
    labels.breakdown,
    ...result.parts.map((part) => `${labels.parts[part.id]}: ${Math.round(part.macros.kcal)}`),
    "",
    labels.note,
  ];
  return lines.join("\n");
}
