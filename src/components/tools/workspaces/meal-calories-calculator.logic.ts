/** Pure meal arithmetic. No DOM, React, locale formatting or network calls. */

export interface Macros {
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  sugar: number;
  /** Milligrams of sodium per serving. */
  sodium: number;
}

/** A table of everyday foods. Values describe one named serving. */
export const FOODS = [
  { id: "apple", kcal: 95, protein: 0.5, carbs: 25, fat: 0.3, fiber: 4.4, sugar: 19, sodium: 2 },
  { id: "banana", kcal: 105, protein: 1.3, carbs: 27, fat: 0.4, fiber: 3.1, sugar: 14, sodium: 1 },
  { id: "egg", kcal: 72, protein: 6.3, carbs: 0.4, fat: 4.8, fiber: 0, sugar: 0.4, sodium: 72 },
  { id: "chickenBreast", kcal: 165, protein: 31, carbs: 0, fat: 3.6, fiber: 0, sugar: 0, sodium: 74 },
  { id: "whiteRice", kcal: 206, protein: 4.3, carbs: 45, fat: 0.4, fiber: 0.6, sugar: 0.1, sodium: 2 },
  { id: "wholeWheatBread", kcal: 81, protein: 4, carbs: 14, fat: 1.1, fiber: 1.9, sugar: 1.4, sodium: 150 },
  { id: "greekYogurt", kcal: 130, protein: 14, carbs: 8, fat: 4, fiber: 0, sugar: 7, sodium: 36 },
  { id: "almonds", kcal: 164, protein: 6, carbs: 6, fat: 14, fiber: 3.5, sugar: 1.2, sodium: 1 },
  { id: "salmon", kcal: 208, protein: 22, carbs: 0, fat: 13, fiber: 0, sugar: 0, sodium: 59 },
  { id: "broccoli", kcal: 55, protein: 3.7, carbs: 11, fat: 0.6, fiber: 4.6, sugar: 2.6, sodium: 47 },
  { id: "avocado", kcal: 160, protein: 2, carbs: 9, fat: 15, fiber: 6.7, sugar: 0.7, sodium: 7 },
  { id: "pasta", kcal: 200, protein: 7, carbs: 41, fat: 1, fiber: 2.4, sugar: 0.7, sodium: 1 },
  { id: "milk", kcal: 149, protein: 8, carbs: 12, fat: 8, fiber: 0, sugar: 12, sodium: 107 },
  { id: "cheddar", kcal: 120, protein: 7, carbs: 0.4, fat: 10, fiber: 0, sugar: 0.1, sodium: 190 },
  { id: "tofu", kcal: 144, protein: 17, carbs: 3, fat: 9, fiber: 2.3, sugar: 0.6, sodium: 14 },
  { id: "lentils", kcal: 230, protein: 18, carbs: 40, fat: 0.8, fiber: 16, sugar: 3.4, sodium: 2 },
  { id: "orange", kcal: 62, protein: 1.2, carbs: 15, fat: 0.2, fiber: 3.1, sugar: 12, sodium: 0 },
  { id: "strawberries", kcal: 49, protein: 1, carbs: 12, fat: 0.5, fiber: 3.2, sugar: 7.4, sodium: 1 },
  { id: "blueberries", kcal: 84, protein: 1.1, carbs: 21, fat: 0.5, fiber: 3.6, sugar: 15, sodium: 1 },
  { id: "grapes", kcal: 104, protein: 1.1, carbs: 27, fat: 0.2, fiber: 1.4, sugar: 23, sodium: 3 },
  { id: "carrot", kcal: 25, protein: 0.6, carbs: 6, fat: 0.1, fiber: 1.7, sugar: 3, sodium: 22 },
  { id: "spinach", kcal: 23, protein: 2.9, carbs: 3.6, fat: 0.4, fiber: 2.2, sugar: 0.4, sodium: 79 },
  { id: "sweetPotato", kcal: 112, protein: 2, carbs: 26, fat: 0.1, fiber: 3.9, sugar: 5.4, sodium: 36 },
  { id: "potato", kcal: 87, protein: 1.9, carbs: 20, fat: 0.1, fiber: 1.8, sugar: 0.9, sodium: 6 },
  { id: "oatmeal", kcal: 154, protein: 5.4, carbs: 27, fat: 2.9, fiber: 4, sugar: 0.5, sodium: 2 },
  { id: "brownRice", kcal: 216, protein: 5, carbs: 45, fat: 1.8, fiber: 3.5, sugar: 0.7, sodium: 10 },
  { id: "quinoa", kcal: 222, protein: 8.1, carbs: 39, fat: 3.6, fiber: 5.2, sugar: 1.7, sodium: 13 },
  { id: "wholeWheatPasta", kcal: 174, protein: 7.5, carbs: 37, fat: 0.8, fiber: 6.3, sugar: 2, sodium: 4 },
  { id: "blackBeans", kcal: 227, protein: 15, carbs: 41, fat: 0.9, fiber: 15, sugar: 0.7, sodium: 2 },
  { id: "chickpeas", kcal: 269, protein: 14.5, carbs: 45, fat: 4.3, fiber: 12.5, sugar: 8, sodium: 24 },
  { id: "peanutButter", kcal: 188, protein: 8, carbs: 7, fat: 16, fiber: 1.9, sugar: 1.2, sodium: 98 },
  { id: "walnuts", kcal: 185, protein: 4.3, carbs: 4, fat: 18, fiber: 1.9, sugar: 1, sodium: 1 },
  { id: "cottageCheese", kcal: 206, protein: 28, carbs: 8, fat: 9, fiber: 0, sugar: 3, sodium: 364 },
  { id: "mozzarella", kcal: 280, protein: 28, carbs: 3.1, fat: 17, fiber: 0, sugar: 1.2, sodium: 627 },
  { id: "beef", kcal: 217, protein: 26, carbs: 0, fat: 12, fiber: 0, sugar: 0, sodium: 66 },
  { id: "turkey", kcal: 135, protein: 30, carbs: 0, fat: 1, fiber: 0, sugar: 0, sodium: 51 },
  { id: "tuna", kcal: 132, protein: 28, carbs: 0, fat: 1, fiber: 0, sugar: 0, sodium: 47 },
  { id: "shrimp", kcal: 99, protein: 24, carbs: 0.2, fat: 0.3, fiber: 0, sugar: 0, sodium: 111 },
  { id: "plainYogurt", kcal: 104, protein: 5.5, carbs: 8, fat: 5, fiber: 0, sugar: 8, sodium: 113 },
  { id: "honey", kcal: 64, protein: 0, carbs: 17, fat: 0, fiber: 0, sugar: 17, sodium: 1 },
  { id: "oliveOil", kcal: 119, protein: 0, carbs: 0, fat: 13.5, fiber: 0, sugar: 0, sodium: 0 },
  { id: "darkChocolate", kcal: 170, protein: 2.2, carbs: 13, fat: 12, fiber: 3, sugar: 7, sodium: 20 },
  { id: "popcorn", kcal: 93, protein: 3, carbs: 19, fat: 1, fiber: 3.6, sugar: 0.2, sodium: 2 },
  { id: "orangeJuice", kcal: 112, protein: 1.6, carbs: 26, fat: 0.4, fiber: 0.5, sugar: 21, sodium: 2 },
] as const;

export type FoodId = (typeof FOODS)[number]["id"];
export type Food = (typeof FOODS)[number];

export const QUICK_FOOD_IDS: readonly FoodId[] = [
  "chickenBreast",
  "whiteRice",
  "egg",
  "banana",
  "avocado",
  "greekYogurt",
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
const MAX_SODIUM = 10000;
const MAX_RESULTS = 8;

function emptyMacros(): Macros {
  return { kcal: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, sugar: 0, sodium: 0 };
}

/** Filter the table by a translated food name, with an empty query showing popular items. */
export function filterFoods(query: string, labels: Record<FoodId, string>): readonly Food[] {
  const needle = query.trim().toLocaleLowerCase();
  if (!needle) return FOODS.slice(0, MAX_RESULTS);
  return FOODS.filter((food) => labels[food.id].toLocaleLowerCase().includes(needle)).slice(0, MAX_RESULTS);
}

export function validateMeal(entries: readonly MealEntry[]): MealErrorCode | null {
  if (entries.length > MAX_ITEMS) return "TOO_MANY_ITEMS";
  for (const entry of entries) {
    if (!entry.name.trim()) return "EMPTY_NAME";
    const numbers = [
      entry.quantity,
      entry.kcal,
      entry.protein,
      entry.carbs,
      entry.fat,
      entry.fiber,
      entry.sugar,
      entry.sodium,
    ];
    if (numbers.some((value) => !Number.isFinite(value))) return "INVALID_NUMBER";
    if (
      entry.quantity < 0 || entry.quantity > MAX_SERVINGS ||
      entry.kcal < 0 || entry.kcal > MAX_KCAL ||
      entry.protein < 0 || entry.protein > MAX_MACRO ||
      entry.carbs < 0 || entry.carbs > MAX_MACRO ||
      entry.fat < 0 || entry.fat > MAX_MACRO ||
      entry.fiber < 0 || entry.fiber > MAX_MACRO ||
      entry.sugar < 0 || entry.sugar > MAX_MACRO ||
      entry.sodium < 0 || entry.sodium > MAX_SODIUM
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
      fiber: entry.fiber * entry.quantity,
      sugar: entry.sugar * entry.quantity,
      sodium: entry.sodium * entry.quantity,
    },
  }));

  const macros = lines.reduce<Macros>((total, line) => ({
    kcal: total.kcal + line.macros.kcal,
    protein: total.protein + line.macros.protein,
    carbs: total.carbs + line.macros.carbs,
    fat: total.fat + line.macros.fat,
    fiber: total.fiber + line.macros.fiber,
    sugar: total.sugar + line.macros.sugar,
    sodium: total.sodium + line.macros.sodium,
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
  fiber: string;
  sugar: string;
  sodium: string;
  times: string;
  unit: string;
  unitGram: string;
  unitMg: string;
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
    `${labels.protein}: ${result.macros.protein.toFixed(1)} ${labels.unitGram}`,
    `${labels.carbs}: ${result.macros.carbs.toFixed(1)} ${labels.unitGram}`,
    `${labels.fat}: ${result.macros.fat.toFixed(1)} ${labels.unitGram}`,
    `${labels.fiber}: ${result.macros.fiber.toFixed(1)} ${labels.unitGram}`,
    `${labels.sugar}: ${result.macros.sugar.toFixed(1)} ${labels.unitGram}`,
    `${labels.sodium}: ${Math.round(result.macros.sodium)} ${labels.unitMg}`,
    "",
    labels.note,
  ];
  return lines.join("\n");
}
