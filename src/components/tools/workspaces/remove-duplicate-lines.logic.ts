/** Pure, DOM-free logic for Remove Duplicate Lines. */

export type KeepMode = "first" | "last";

export type DedupeOptions = {
  caseSensitive: boolean;
  keep: KeepMode;
  trim: boolean;
};

export type DedupeResult = {
  lines: string[];
  output: string;
  inputCount: number;
  outputCount: number;
  removed: number;
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

export const DEDUPE_LIMITS = {
  maxChars: 400_000,
  maxLines: 5_000,
} as const;

export const DEFAULT_DEDUPE_OPTIONS: DedupeOptions = {
  caseSensitive: true,
  keep: "first",
  trim: true,
};

/** Split on real line breaks, not on visual wrapping. */
export function splitLines(text: string): string[] {
  if (text.length === 0) return [];
  const normalised = text.replace(/\r\n?/gu, "\n").replace(/\n$/u, "");
  return normalised.split("\n");
}

function keyFor(line: string, options: DedupeOptions): string {
  const cleaned = options.trim ? line.trim() : line;
  return options.caseSensitive ? cleaned : cleaned.toLowerCase();
}

/**
 * Keep either the first or the last occurrence of each distinct line.
 * Output order follows the occurrence that survives, so the result stays
 * close to the source. Only the comparison key is lowercased; the displayed
 * line keeps its original capitalisation.
 */
export function removeDuplicateLines(
  text: string,
  options: DedupeOptions,
): DedupeResult {
  const source = splitLines(text);
  if (
    text.length > DEDUPE_LIMITS.maxChars ||
    source.length > DEDUPE_LIMITS.maxLines
  ) {
    throw new LineToolsError("TOO_LARGE");
  }

  const survivors = new Map<string, { line: string; index: number }>();
  source.forEach((sourceLine, index) => {
    const line = options.trim ? sourceLine.trim() : sourceLine;
    const key = keyFor(line, options);
    const previous = survivors.get(key);
    if (!previous || options.keep === "last") {
      survivors.set(key, { line, index });
    }
  });

  const lines = [...survivors.values()]
    .sort((a, b) => a.index - b.index)
    .map((entry) => entry.line);

  return {
    lines,
    output: lines.join("\n"),
    inputCount: source.length,
    outputCount: lines.length,
    removed: source.length - lines.length,
  };
}
