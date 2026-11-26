/** Pure, DOM-free logic for Sort Text Lines. */

export type SortDirection = "asc" | "desc";

export type SortOptions = {
  direction: SortDirection;
  caseSensitive: boolean;
  natural: boolean;
};

export type SortResult = {
  lines: string[];
  output: string;
  lineCount: number;
}

export type LineToolsErrorCode = "TOO_LARGE";

export class LineToolsError extends Error {
  readonly code: LineToolsErrorCode;

  constructor(code: LineToolsErrorCode) {
    super(code);
    this.name = "LineToolsError";
    this.code = code;
  }
}

export const SORT_LIMITS = {
  maxChars: 400_000,
  maxLines: 5_000,
} as const;

export const DEFAULT_SORT_OPTIONS: SortOptions = {
  direction: "asc",
  caseSensitive: false,
  natural: true,
};

/** Split on real line breaks, not on visual wrapping. */
export function splitLines(text: string): string[] {
  if (text.length === 0) return [];
  const normalised = text.replace(/\r\n?/gu, "\n").replace(/\n$/u, "");
  return normalised.split("\n");
}

function simpleCompare(left: string, right: string): number {
  if (left < right) return -1;
  if (left > right) return 1;
  return 0;
}

function numericCompare(left: string, right: string): number {
  const a = left.replace(/^0+/u, "") || "0";
  const b = right.replace(/^0+/u, "") || "0";
  if (a.length !== b.length) return a.length < b.length ? -1 : 1;
  return simpleCompare(a, b);
}

function chunk(value: string): string[] {
  return value.match(/\d+|\D+/gu) ?? [];
}

/** Compare digit runs by value and text runs character by character. */
function naturalCompare(left: string, right: string): number {
  const a = chunk(left);
  const b = chunk(right);
  const shared = Math.min(a.length, b.length);

  for (let index = 0; index < shared; index += 1) {
    const x = a[index];
    const y = b[index];
    const xIsNumber = /^\d+$/u.test(x);
    const yIsNumber = /^\d+$/u.test(y);

    if (xIsNumber && yIsNumber) {
      const numeric = numericCompare(x, y);
      if (numeric !== 0) return numeric;
      continue;
    }
    if (xIsNumber !== yIsNumber) return xIsNumber ? -1 : 1;

    const textOrder = simpleCompare(x, y);
    if (textOrder !== 0) return textOrder;
  }

  return a.length - b.length;
}

/**
 * Sort a list of lines without mutating the input. Equal lines keep their
 * original order, and a final raw comparison keeps ties deterministic when
 * case sensitivity is off.
 */
export function sortTextLines(
  text: string,
  options: SortOptions,
): SortResult {
  const source = splitLines(text);
  if (
    text.length > SORT_LIMITS.maxChars ||
    source.length > SORT_LIMITS.maxLines
  ) {
    throw new LineToolsError("TOO_LARGE");
  }

  const lines = source
    .map((line, index) => ({ line, index }))
    .sort((a, b) => {
      const left = options.caseSensitive ? a.line : a.line.toLowerCase();
      const right = options.caseSensitive ? b.line : b.line.toLowerCase();
      const primary = options.natural
        ? naturalCompare(left, right)
        : simpleCompare(left, right);
      if (primary !== 0) {
        return options.direction === "asc" ? primary : -primary;
      }
      return a.index - b.index;
    })
    .map((entry) => entry.line);

  return {
    lines,
    output: lines.join("\n"),
    lineCount: lines.length,
  };
}
