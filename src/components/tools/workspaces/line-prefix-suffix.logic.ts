/**
 * Pure line decoration engine. No DOM, React, storage or network access.
 * Every line is built from plain string operations and returned as data.
 */

export type LineErrorCode = "EMPTY_TEXT" | "NOTHING_TO_ADD" | "INVALID_START";

export interface LineOptions {
  prefix: string;
  suffix: string;
  wrapper: string;
  numberLines: boolean;
  skipEmpty: boolean;
  trim: boolean;
  startAt: number;
}

export const DEFAULT_LINE_OPTIONS: LineOptions = {
  prefix: "",
  suffix: "",
  wrapper: "",
  numberLines: false,
  skipEmpty: true,
  trim: false,
  startAt: 1,
};

export const MAX_LINES = 2_000;

export interface LineResult {
  lines: string[];
  output: string;
  inputLines: number;
  outputLines: number;
  decoratedLines: number;
  error?: { code: LineErrorCode };
}

/** Split on LF, CR or CRLF and apply prefix, wrapper, suffix and numbering. */
export function decorateLines(text: string, options: LineOptions): LineResult {
  const source = text.split(/\r\n|\r|\n/u);
  const inputLines = text.length === 0 ? 0 : source.length;
  const empty: LineResult = {
    lines: [],
    output: "",
    inputLines,
    outputLines: 0,
    decoratedLines: 0,
  };

  if (text.length === 0) return empty;
  if (!Number.isInteger(options.startAt) || options.startAt < 1) {
    return { ...empty, error: { code: "INVALID_START" } };
  }
  if (
    options.prefix.length === 0 &&
    options.suffix.length === 0 &&
    options.wrapper.length === 0 &&
    !options.numberLines
  ) {
    return { ...empty, error: { code: "NOTHING_TO_ADD" } };
  }

  const lines: string[] = [];

  for (const line of source) {
    const value = options.trim ? line.trim() : line;
    if (options.skipEmpty && value.trim().length === 0) continue;

    const ordinal = options.startAt + lines.length;
    const number = options.numberLines ? `${String(ordinal).padStart(2, "0")}. ` : "";
    lines.push(
      `${number}${options.prefix}${options.wrapper}${value}${options.wrapper}${options.suffix}`,
    );
  }

  return {
    lines,
    output: lines.join("\n"),
    inputLines,
    outputLines: lines.length,
    decoratedLines: lines.length,
  };
}
