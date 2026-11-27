/** Pure, browser-free text repetition math. No DOM, React, storage or side effects. */

export type Separator = "newline" | "space" | "comma" | "custom";

export const SEPARATORS: readonly Separator[] = ["newline", "space", "comma", "custom"];

export const MIN_REPEATS = 1;
export const MAX_REPEATS = 500;

export type TextRepeaterErrorCode =
  | "EMPTY_TEXT"
  | "INVALID_COUNT"
  | "COUNT_OUT_OF_RANGE"
  | "EMPTY_DELIMITER";

export interface TextRepeaterInput {
  text: string;
  count: string;
  separator: Separator;
  customDelimiter: string;
  numberLines: boolean;
}

export interface TextStats {
  /** User-perceived characters, counted as Unicode code points. */
  characters: number;
  /** Physical line breaks plus one, zero for an empty string. */
  lines: number;
}

export interface TextRepeaterValue {
  output: string;
  repeats: number;
  inputCharacters: number;
  inputLines: number;
  outputCharacters: number;
  outputLines: number;
}

export interface TextRepeaterResult {
  value?: TextRepeaterValue;
  error?: { code: TextRepeaterErrorCode };
}

/** Count characters and physical lines without touching the DOM. */
export function countText(text: string): TextStats {
  return {
    characters: Array.from(text).length,
    lines: text.length === 0 ? 0 : text.split(/\r\n|\r|\n/u).length,
  };
}

/** Accept only a plain whole number, so decimals and signs are rejected. */
export function parseCount(raw: string): number | null {
  const trimmed = raw.trim();
  if (!/^\d+$/u.test(trimmed)) return null;
  const parsed = Number(trimmed);
  return Number.isSafeInteger(parsed) ? parsed : null;
}

/** Resolve the chosen separator, or null when a custom delimiter is missing. */
export function separatorValue(input: TextRepeaterInput): string | null {
  switch (input.separator) {
    case "newline":
      return "\n";
    case "space":
      return " ";
    case "comma":
      return ", ";
    case "custom":
      return input.customDelimiter.length > 0 ? input.customDelimiter : null;
  }
}

/** Validate the input and build the repeated output with optional numbering. */
export function calculateTextRepeater(input: TextRepeaterInput): TextRepeaterResult {
  if (input.text.trim().length === 0) return { error: { code: "EMPTY_TEXT" } };

  const repeats = parseCount(input.count);
  if (repeats === null) return { error: { code: "INVALID_COUNT" } };
  if (repeats < MIN_REPEATS || repeats > MAX_REPEATS) {
    return { error: { code: "COUNT_OUT_OF_RANGE" } };
  }

  const delimiter = separatorValue(input);
  if (delimiter === null) return { error: { code: "EMPTY_DELIMITER" } };

  const copies: string[] = [];
  for (let index = 0; index < repeats; index += 1) {
    copies.push(input.numberLines ? `${index + 1}. ${input.text}` : input.text);
  }
  const output = copies.join(delimiter);
  const sourceStats = countText(input.text);
  const outputStats = countText(output);

  return {
    value: {
      output,
      repeats,
      inputCharacters: sourceStats.characters,
      inputLines: sourceStats.lines,
      outputCharacters: outputStats.characters,
      outputLines: outputStats.lines,
    },
  };
}
