/**
 * Pure LCS-based text diff. No DOM, no React, no UI strings.
 * Line endings are normalised; punctuation, case and whitespace tokens are
 * never silently ignored.
 */

export type DiffMode = "lines" | "words";
export type DiffKind = "same" | "added" | "removed";

export type DiffRow = {
  kind: DiffKind;
  left?: string;
  right?: string;
};

export type DiffStats = {
  added: number;
  removed: number;
  unchanged: number;
  similarity: number;
};

export type DiffResult = {
  rows: DiffRow[];
  stats: DiffStats;
};

export type DiffErrorCode = "TOO_LARGE";

/** Typed, translatable error: the UI decides what wording to show. */
export class DiffError extends Error {
  readonly code: DiffErrorCode;

  constructor(code: DiffErrorCode) {
    super(code);
    this.name = "DiffError";
    this.code = code;
  }
}

export const DIFF_TOKEN_LIMIT = 600;

export type DiffOptions = {
  mode: DiffMode;
};

export const DEFAULT_DIFF_OPTIONS: DiffOptions = {
  mode: "words",
};

function tokenize(text: string, mode: DiffMode): string[] {
  const normalized = text.replace(/\r\n?/gu, "\n");
  if (mode === "lines") {
    return normalized.length === 0 ? [] : normalized.split("\n");
  }
  const trimmed = normalized.trim();
  return trimmed ? trimmed.split(/\s+/u) : [];
}

/** Compare two texts and return ordered rows plus summary statistics. */
export function diffText(
  original: string,
  revised: string,
  mode: DiffMode,
): DiffResult {
  const left = tokenize(original, mode);
  const right = tokenize(revised, mode);

  if (left.length > DIFF_TOKEN_LIMIT || right.length > DIFF_TOKEN_LIMIT) {
    throw new DiffError("TOO_LARGE");
  }

  const rows: DiffRow[] = [];
  const n = left.length;
  const m = right.length;
  const width = m + 1;
  const table = new Uint16Array((n + 1) * width);

  for (let i = 1; i <= n; i += 1) {
    for (let j = 1; j <= m; j += 1) {
      table[i * width + j] =
        left[i - 1] === right[j - 1]
          ? table[(i - 1) * width + (j - 1)] + 1
          : Math.max(table[(i - 1) * width + j], table[i * width + (j - 1)]);
    }
  }

  let i = n;
  let j = m;
  const reversed: DiffRow[] = [];

  while (i > 0 && j > 0) {
    if (left[i - 1] === right[j - 1]) {
      reversed.push({ kind: "same", left: left[i - 1], right: right[j - 1] });
      i -= 1;
      j -= 1;
    } else if (table[(i - 1) * width + j] > table[i * width + (j - 1)]) {
      reversed.push({ kind: "removed", left: left[i - 1] });
      i -= 1;
    } else {
      // Ties prefer the added row while walking backwards, so the final
      // forward order shows a removal immediately before its addition.
      reversed.push({ kind: "added", right: right[j - 1] });
      j -= 1;
    }
  }

  while (i > 0) {
    reversed.push({ kind: "removed", left: left[i - 1] });
    i -= 1;
  }

  while (j > 0) {
    reversed.push({ kind: "added", right: right[j - 1] });
    j -= 1;
  }

  for (let index = reversed.length - 1; index >= 0; index -= 1) {
    rows.push(reversed[index]);
  }

  const longest = table[n * width + m];
  const total = Math.max(n, m);

  return {
    rows,
    stats: {
      added: rows.filter((row) => row.kind === "added").length,
      removed: rows.filter((row) => row.kind === "removed").length,
      unchanged: longest,
      similarity: total === 0 ? 0 : Math.round((longest / total) * 100),
    },
  };
}

/** Plain unified-style text for clipboard and downloads. */
export function formatPlainDiff(rows: DiffRow[]): string {
  return rows
    .map((row) => {
      if (row.kind === "added") return `+ ${row.right ?? ""}`;
      if (row.kind === "removed") return `- ${row.left ?? ""}`;
      return `  ${row.left ?? ""}`;
    })
    .join("\n");
}
