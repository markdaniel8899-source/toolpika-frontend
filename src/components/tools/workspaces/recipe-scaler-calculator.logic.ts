/** Pure arithmetic and text formatting for scaling a recipe. No DOM, React or locale formatting. */

export type MultiplierChip = "0.5" | "1" | "2" | "3";

export const MULTIPLIER_CHIPS: readonly MultiplierChip[] = ["0.5", "1", "2", "3"];

export const DEFAULTS = {
  baseServings: 4,
  desiredServings: 6,
  chip: "" as MultiplierChip | "",
};

const GLYPH_VALUE: Record<string, number> = {
  "½": 0.5,
  "¼": 0.25,
  "¾": 0.75,
  "⅓": 1 / 3,
  "⅔": 2 / 3,
  "⅙": 1 / 6,
  "⅚": 5 / 6,
  "⅛": 0.125,
  "⅜": 0.375,
  "⅝": 0.625,
  "⅞": 0.875,
};

const FRACTION_GLYPH: Record<string, string> = {
  "1/2": "½",
  "1/3": "⅓",
  "2/3": "⅔",
  "1/4": "¼",
  "3/4": "¾",
  "1/6": "⅙",
  "5/6": "⅚",
  "1/8": "⅛",
  "3/8": "⅜",
  "5/8": "⅝",
  "7/8": "⅞",
};

const GLYPHS = "½¼¾⅓⅔⅙⅚⅛⅜⅝⅞";
const NUMBER = "\\d+(?:\\.\\d+)?";
const LEADING_QUANTITY = new RegExp(
  `^(\\s*)(${NUMBER}\\s+${NUMBER}\\/${NUMBER}|${NUMBER}\\/${NUMBER}|${NUMBER}\\s*[${GLYPHS}]|[${GLYPHS}]|${NUMBER})(\\s*)(.*)$`,
  "u",
);

export type RecipeErrorCode = "INVALID_NUMBER" | "OUT_OF_RANGE" | "EMPTY";

export interface RecipeInput {
  text: string;
  baseServings: number;
  desiredServings: number;
}

export interface ScaledLine {
  original: string;
  scaled: string;
  changed: boolean;
}

export interface RecipeResult {
  error?: { code: RecipeErrorCode };
  factor: number;
  lines: ScaledLine[];
  changedCount: number;
}

function fail(code: RecipeErrorCode): RecipeResult {
  return { factor: 0, lines: [], changedCount: 0, error: { code } };
}

/** Parse a leading amount such as 2, 1.5, 1/2, 1 1/2 or 1½. */
export function parseLeadingAmount(token: string): number | null {
  const trimmed = token.trim();
  if (!trimmed) return null;

  const single = GLYPH_VALUE[trimmed];
  if (single !== undefined) return single;

  const mixedGlyph = trimmed.match(new RegExp(`^(\\d+)\\s*([${GLYPHS}])$`, "u"));
  if (mixedGlyph) {
    return Number(mixedGlyph[1]) + GLYPH_VALUE[mixedGlyph[2]];
  }

  const mixedFraction = trimmed.match(/^(\d+)\s+(\d+)\/(\d+)$/u);
  if (mixedFraction) {
    const denominator = Number(mixedFraction[3]);
    if (denominator <= 0) return null;
    return Number(mixedFraction[1]) + Number(mixedFraction[2]) / denominator;
  }

  const fraction = trimmed.match(/^(\d+)\/(\d+)$/u);
  if (fraction) {
    const denominator = Number(fraction[2]);
    if (denominator <= 0) return null;
    return Number(fraction[1]) / denominator;
  }

  const plain = Number(trimmed);
  return Number.isFinite(plain) ? plain : null;
}

/** Render an amount as a common fraction when close, otherwise as a short decimal. */
export function formatAmount(value: number): string {
  if (!Number.isFinite(value) || value <= 0) return "0";

  const rounded = Math.round(value * 1000) / 1000;
  const whole = Math.floor(rounded + Number.EPSILON);
  const remainder = rounded - whole;
  const seen = new Set<number>();
  let fraction = "";
  let bestGap = 0.02;

  for (let denominator = 2; denominator <= 8; denominator += 1) {
    for (let numerator = 1; numerator < denominator; numerator += 1) {
      const candidate = numerator / denominator;
      if (seen.has(candidate)) continue;
      seen.add(candidate);
      const gap = Math.abs(remainder - candidate);
      if (gap <= bestGap) {
        bestGap = gap;
        fraction = `${numerator}/${denominator}`;
      }
    }
  }

  if (fraction) {
    const glyph = FRACTION_GLYPH[fraction];
    if (whole === 0) return glyph ?? fraction;
    return glyph ? `${whole}${glyph}` : `${whole} ${fraction}`;
  }

  return String(Math.round(rounded * 100) / 100);
}

/** Scale just the leading amount on each ingredient line. */
export function scaleLine(line: string, factor: number): ScaledLine {
  const match = line.match(LEADING_QUANTITY);
  if (!match) return { original: line, scaled: line, changed: false };

  const value = parseLeadingAmount(match[2]);
  if (value === null) return { original: line, scaled: line, changed: false };

  return {
    original: line,
    scaled: `${match[1]}${formatAmount(value * factor)}${match[3]}${match[4]}`,
    changed: true,
  };
}

/** Resize an ingredient list by desired servings divided by original servings. */
export function calculateRecipe(input: RecipeInput): RecipeResult {
  const { text, baseServings, desiredServings } = input;
  const sourceLines = text.split(/\r?\n/u).map((line) => line.trim()).filter(Boolean);

  if (sourceLines.length === 0) return fail("EMPTY");
  if (
    !Number.isFinite(baseServings) || baseServings <= 0 ||
    !Number.isFinite(desiredServings) || desiredServings <= 0
  ) {
    return fail("INVALID_NUMBER");
  }
  if (baseServings < 1 || baseServings > 100 || desiredServings < 1 || desiredServings > 200) {
    return fail("OUT_OF_RANGE");
  }
  if (sourceLines.length > 60) return fail("OUT_OF_RANGE");

  const factor = desiredServings / baseServings;
  const lines = sourceLines.map((line) => scaleLine(line, factor));

  return {
    factor,
    lines,
    changedCount: lines.filter((line) => line.changed).length,
  };
}

/** Format a scale factor for display, for example 0.5, 1.5 or 3. */
export function formatFactor(factor: number): string {
  return String(Math.round(factor * 100) / 100);
}

export interface RecipeReportLabels {
  title: string;
  original: string;
  desired: string;
  factor: string;
  note: string;
}

/** Render the scaled recipe as plain text for clipboard use. */
export function formatRecipeReport(
  result: RecipeResult,
  input: RecipeInput,
  labels: RecipeReportLabels,
): string {
  return [
    labels.title,
    `${labels.original}: ${input.baseServings}`,
    `${labels.desired}: ${input.desiredServings}`,
    `${labels.factor}: ${formatFactor(result.factor)}`,
    "",
    ...result.lines.map((line) => line.scaled),
    "",
    labels.note,
  ].join("\n");
}
