/** Pure text-reversal routines. No DOM, React, storage or side effects. */

export type ReverseMode = "characters" | "words" | "lines" | "letters";

export const REVERSE_MODES: readonly ReverseMode[] = [
  "characters",
  "words",
  "lines",
  "letters",
];

export type ReverseErrorCode = "EMPTY_TEXT";

export interface ReverseTextInput {
  text: string;
  mode: ReverseMode;
  trimWhitespace: boolean;
  preserveCase: boolean;
}

export interface ReverseStats {
  /** User-perceived characters, counted as Unicode code points. */
  characters: number;
  /** Runs of non-whitespace characters. */
  words: number;
}

export interface ReverseTextValue {
  output: string;
  characters: number;
  words: number;
  outputCharacters: number;
}

export interface ReverseTextResult {
  value?: ReverseTextValue;
  error?: { code: ReverseErrorCode };
}

const WHITESPACE = /^\s+$/u;
const LINE_BREAK = /^(?:\r\n|\r|\n)$/u;

/** Count characters and whitespace-separated words. */
export function countText(text: string): ReverseStats {
  const trimmed = text.trim();
  return {
    characters: Array.from(text).length,
    words: trimmed.length === 0 ? 0 : trimmed.split(/\s+/u).length,
  };
}

/** Reverse Unicode code points so emoji and accented letters stay whole. */
export function reverseCharacters(text: string): string {
  return Array.from(text).reverse().join("");
}

/** Reverse words while leaving the original whitespace tokens in place. */
export function reverseWordOrder(text: string): string {
  const parts = text.split(/(\s+)/u);
  const words = parts.filter((part) => part.length > 0 && !WHITESPACE.test(part));
  words.reverse();
  return parts
    .map((part) =>
      part.length === 0 || WHITESPACE.test(part) ? part : (words.shift() ?? ""),
    )
    .join("");
}

/** Reverse lines while leaving the original line breaks in place. */
export function reverseLineOrder(text: string): string {
  const parts = text.split(/(\r\n|\r|\n)/u);
  const lines = parts.filter((part) => !LINE_BREAK.test(part));
  lines.reverse();
  return parts
    .map((part) => (LINE_BREAK.test(part) ? part : (lines.shift() ?? "")))
    .join("");
}

/** Reverse the letters inside each word, keeping the words where they are. */
export function reverseLettersInWords(text: string): string {
  return text
    .split(/(\s+)/u)
    .map((part) =>
      part.length > 0 && !WHITESPACE.test(part) ? reverseCharacters(part) : part,
    )
    .join("");
}

/** Reapply the source capitalization at the same positions after a flip. */
export function applyCasePattern(source: string, target: string): string {
  const before = Array.from(source);
  const after = Array.from(target);
  if (before.length !== after.length) return target;
  return after
    .map((char, index) => {
      const original = before[index];
      if (original === undefined || original.toUpperCase() === original.toLowerCase()) {
        return char;
      }
      return original === original.toUpperCase()
        ? char.toUpperCase()
        : char.toLowerCase();
    })
    .join("");
}

/** Validate the input and apply the selected reversal in a pure function. */
export function calculateReverseText(input: ReverseTextInput): ReverseTextResult {
  if (input.text.trim().length === 0) return { error: { code: "EMPTY_TEXT" } };

  const source = input.trimWhitespace ? input.text.trim() : input.text;
  const counts = countText(source);
  let output: string;

  switch (input.mode) {
    case "characters": {
      const flipped = reverseCharacters(source);
      output = input.preserveCase ? applyCasePattern(source, flipped) : flipped;
      break;
    }
    case "words":
      output = reverseWordOrder(source);
      break;
    case "lines":
      output = reverseLineOrder(source);
      break;
    case "letters": {
      const flipped = reverseLettersInWords(source);
      output = input.preserveCase ? applyCasePattern(source, flipped) : flipped;
      break;
    }
  }

  return {
    value: {
      output,
      characters: counts.characters,
      words: counts.words,
      outputCharacters: Array.from(output).length,
    },
  };
}
