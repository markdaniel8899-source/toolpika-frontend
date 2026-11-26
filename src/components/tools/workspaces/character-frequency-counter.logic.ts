/** Pure character counting. No DOM, React or network access. */

export type FrequencyOptions = {
  ignoreCase: boolean;
  ignoreSpaces: boolean;
  includePunctuation: boolean;
};

export const DEFAULT_FREQUENCY_OPTIONS: FrequencyOptions = {
  ignoreCase: true,
  ignoreSpaces: true,
  includePunctuation: false,
};

export type FrequencyErrorCode = "TOO_LARGE";

export type WhitespaceKind = "space" | "tab" | "newline" | "return" | null;

export interface FrequencyRow {
  /** First code point seen for this key, used for display. */
  char: string;
  /** Normalised key used to merge equivalent characters. */
  key: string;
  count: number;
  /** Percentage of all counted characters, rounded to one decimal. */
  percent: number;
  whitespace: WhitespaceKind;
}

export interface FrequencyResult {
  rows: FrequencyRow[];
  total: number;
  error?: { code: FrequencyErrorCode };
}

/** Longer pastes are rejected with a friendly message instead of hanging. */
export const MAX_INPUT_LENGTH = 100_000;

const SPACE = /\s/u;
const PUNCTUATION = /\p{P}/u;

function whitespaceKind(char: string): WhitespaceKind {
  if (char === " ") return "space";
  if (char === "\t") return "tab";
  if (char === "\n") return "newline";
  if (char === "\r") return "return";
  return null;
}

/** Count Unicode code points under the selected rules and sort by frequency. */
export function countCharacters(text: string, options: FrequencyOptions): FrequencyResult {
  if (text.length > MAX_INPUT_LENGTH) {
    return { rows: [], total: 0, error: { code: "TOO_LARGE" } };
  }

  const counts = new Map<string, { char: string; count: number; whitespace: WhitespaceKind }>();
  let total = 0;

  for (const char of Array.from(text)) {
    if (options.ignoreSpaces && SPACE.test(char)) continue;
    if (!options.includePunctuation && PUNCTUATION.test(char)) continue;

    const key = options.ignoreCase ? char.toLowerCase() : char;
    const existing = counts.get(key);
    if (existing) {
      existing.count += 1;
    } else {
      counts.set(key, { char, count: 1, whitespace: whitespaceKind(char) });
    }
    total += 1;
  }

  const rows: FrequencyRow[] = Array.from(counts, ([key, item]) => ({
    char: item.char,
    key,
    count: item.count,
    percent: total === 0 ? 0 : Math.round((item.count / total) * 1000) / 10,
    whitespace: item.whitespace,
  }));

  rows.sort((a, b) => {
    if (a.count !== b.count) return b.count - a.count;
    if (a.key === b.key) return 0;
    return a.key < b.key ? -1 : 1;
  });

  return { rows, total };
}

/** Render the table as plain text for clipboard and file export. */
export function formatFrequencyText(
  rows: FrequencyRow[],
  labelFor: (row: FrequencyRow) => string,
  headers: { character: string; count: string; share: string },
): string {
  const lines = [`${headers.character}\t${headers.count}\t${headers.share}`];
  for (const row of rows) {
    lines.push(`${labelFor(row)}\t${row.count}\t${row.percent}%`);
  }
  return lines.join("\n");
}
