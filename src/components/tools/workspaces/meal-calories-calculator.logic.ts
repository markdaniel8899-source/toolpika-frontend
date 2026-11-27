/** Pure meal arithmetic. No DOM, React, locale formatting or network calls. */

export interface Macros {
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
}

/** A small table of everyday foods. Values describe one named serving. */
export const FOODS = [
  { id: "apple", kcal: 95, protein: 0.5, carbs: 25, fat: 0.3 },
  { id: "banana", kcal: 105, protein: 1.3, carbs: 27, fat: 0.4 },
  { id: "egg", kcal: 72, protein: 6.3, carbs: 0.4, fat: 4.8 },
  { id: "chickenBreast", kcal: 165, protein: 31, carbs: 0, fat: 3.6 },
  { id: "whiteRice", kcal: 206, protein: 4.3, carbs: 45, fat: 0.4 },
  { id: "wholeWheatBread", kcal: 81, protein: 4, carbs: 14, fat: 1.1 },
  { id: "greekYogurt", kcal: 130, protein: 14, carbs: 8, fat: 4 },
  { id: "almonds", kcal: 164, protein: 6, carbs: 6, fat: 14 },
  { id: "salmon", kcal: 208, protein: 22, carbs: 0, fat: 13 },
  { id: "broccoli", kcal: 55, protein: 3.7, carbs: 11, fat: 0.6 },
  { id: "avocado", kcal: 160, protein: 2, carbs: 9, fat: 15 },
  { id: "pasta", kcal: 200, protein: 7, carbs: 41, fat: 1 },
  { id: "milk", kcal: 149, protein: 8, carbs: 12, fat: 8 },
  { id: "cheddar", kcal: 120, protein: 7, carbs: 0.4, fat: 10 },
  { id: "tofu", kcal: 144, protein: 17, carbs: 3, fat: 9 },
  { id: "lentils", kcal: 230, protein: 18, carbs: 40, fat: 0.8 },
] as const;

export type FoodId = (typeof FOODS)[number]["id"];

export const QUICK_FOOD_IDS: readonly FoodId[] = [
  "chickenBreast",
  "whiteRice",
  "egg",
  "banana",
];

export type MealErrorCode =
  | "EMPTY_NAME"
  | "INVALID_NUMBER"
  | "OUT_OF_RANGE"
  | "TOO_MANY_ITEMS";

export interface MealEntry extends Macros {
  key: string;
  name: string;
  quantity: number;
}

export interface MealLine {
  key: string;
  name: string;
  quantity: number;
  macros: Macros;
}

export interface MealResult {
  macros: Macros;
  lines: MealLine[];
  error?: { code: MealErrorCode };
}

const MAX_ITEMS = 30;
const MAX_SERVINGS = 99;
const MAX_KCAL = 5000;
const MAX_MACRO = 500;
const MAX_RESULTS = 8;

function emptyMacros(): Macros {
  return { kcal: 0, protein: 0, carbs: 0, fat: 0 };
}

/** Filter the table by a translated food name, with an empty query showing popular items. */
export function filterFoods(query: string, labels: Record<FoodId, string>): readonly (typeof FOODS)[number][] {
  const needle = query.trim().toLocaleLowerCase();
  if (!needle) return FOODS.slice(0, MAX_RESULTS);
  return FOODS.filter((food) => labels[food.id].toLocaleLowerCase().includes(needle)).slice(0, MAX_RESULTS);
}

export function validateMeal(entries: readonly MealEntry[]): MealErrorCode | null {
  if (entries.length > MAX_ITEMS) return "TOO_MANY_ITEMS";
  for (const entry of entries) {
    if (!entry.name.trim()) return "EMPTY_NAME";
    const numbers = [entry.quantity, entry.kcal, entry.protein, entry.carbs, entry.fat];
    if (numbers.some((value) => !Number.isFinite(value))) return "INVALID_NUMBER";
    if (
      entry.quantity < 0 || entry.quantity > MAX_SERVINGS ||
      entry.kcal < 0 || entry.kcal > MAX_KCAL ||
      entry.protein < 0 || entry.protein > MAX_MACRO ||
      entry.carbs < 0 || entry.carbs > MAX_MACRO ||
      entry.fat < 0 || entry.fat > MAX_MACRO
    ) {
      return "OUT_OF_RANGE";
    }
  }
  return null;
}

/** Multiply every entry by its servings, then add the meal totals. */
export function calculateMeal(entries: readonly MealEntry[]): MealResult {
  const problem = validateMeal(entries);
  if (problem) {
    return { macros: emptyMacros(), lines: [], error: { code: problem } };
  }

  const lines = entries.map((entry) => ({
    key: entry.key,
    name: entry.name,
    quantity: entry.quantity,
    macros: {
      kcal: entry.kcal * entry.quantity,
      protein: entry.protein * entry.quantity,
      carbs: entry.carbs * entry.quantity,
      fat: entry.fat * entry.quantity,
    },
  }));

  const macros = lines.reduce<Macros>((total, line) => ({
    kcal: total.kcal + line.macros.kcal,
    protein: total.protein + line.macros.protein,
    carbs: total.carbs + line.macros.carbs,
    fat: total.fat + line.macros.fat,
  }), emptyMacros());

  return { macros, lines };
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

export interface MealReportLabels {
  title: string;
  total: string;
  protein: string;
  carbs: string;
  fat: string;
  times: string;
  unit: string;
  note: string;
}

/** Plain text summary for the clipboard button. */
export function formatMealReport(result: MealResult, labels: MealReportLabels): string {
  if (result.error) return "";
  const lines = [
    labels.title,
    ...result.lines.map((line) => (
      `${line.name} ${labels.times} ${line.quantity}: ${Math.round(line.macros.kcal)} ${labels.unit}`
    )),
    "",
    `${labels.total}: ${Math.round(result.macros.kcal)} ${labels.unit}`,
    `${labels.protein}: ${result.macros.protein.toFixed(1)} g`,
    `${labels.carbs}: ${result.macros.carbs.toFixed(1)} g`,
    `${labels.fat}: ${result.macros.fat.toFixed(1)} g`,
    "",
    labels.note,
  ];
  return lines.join("\n");
}
