/** Pure, Unicode-aware word tokenisation and keyword density. No DOM or React. */

export type DensityOptions = {
  minWordLength: number;
  ignoreCase: boolean;
  excludeStopwords: boolean;
};

export const DEFAULT_DENSITY_OPTIONS: DensityOptions = {
  minWordLength: 3,
  ignoreCase: true,
  excludeStopwords: true,
};

export type DensityErrorCode = "TOO_LARGE";

export interface DensityRow {
  /** First spelling seen, used for display. */
  word: string;
  /** Normalised key used to merge equivalent words. */
  key: string;
  count: number;
  /** Share of all counted words, rounded to one decimal. */
  percent: number;
}

export interface DensityResult {
  rows: DensityRow[];
  total: number;
  unique: number;
  truncated: boolean;
  error?: { code: DensityErrorCode };
}

/** Very long pastes are rejected with a friendly message instead of hanging. */
export const MAX_INPUT_LENGTH = 100_000;
export const TOP_WORDS = 20;
export const MIN_WORD_LENGTH = 1;
export const MAX_WORD_LENGTH = 20;

/** Common English function words, compared in lowercase. */
const STOPWORDS = new Set([
  "a", "about", "above", "after", "again", "against", "all", "am", "an", "and",
  "any", "are", "as", "at", "be", "because", "been", "before", "being", "below",
  "between", "both", "but", "by", "can", "could", "did", "do", "does", "doing",
  "down", "during", "each", "few", "for", "from", "further", "had", "has", "have",
  "having", "he", "her", "here", "hers", "herself", "him", "himself", "his", "how",
  "i", "if", "in", "into", "is", "it", "its", "itself", "just", "me", "more", "most",
  "my", "myself", "no", "nor", "not", "now", "of", "off", "on", "once", "only",
  "or", "other", "our", "ours", "ourselves", "out", "over", "own", "s", "same",
  "she", "should", "so", "some", "such", "t", "than", "that", "the", "their",
  "theirs", "them", "themselves", "then", "there", "these", "they", "this", "those",
  "through", "to", "too", "under", "until", "up", "very", "was", "we", "were",
  "what", "when", "where", "which", "while", "who", "whom", "why", "will", "with",
  "you", "your", "yours", "yourself", "yourselves",
]);

/**
 * A word starts with a Unicode letter, then may contain letters, marks and
 * digits. Internal apostrophes or hyphens stay inside a word only when they
 * are followed by another letter, so "don't" stays whole and a dash between
 * sentences splits the words.
 */
const WORD = /[\p{L}][\p{L}\p{M}\p{N}]*(?:['\u2019\u02BC-][\p{L}\p{M}\p{N}]+)*/gu;

function lengthInCodePoints(token: string): number {
  return Array.from(token).length;
}

/** Tokenise, filter and rank words by frequency. */
export function analyzeDensity(text: string, options: DensityOptions): DensityResult {
  if (text.length > MAX_INPUT_LENGTH) {
    return { rows: [], total: 0, unique: 0, truncated: false, error: { code: "TOO_LARGE" } };
  }

  const min = Math.max(MIN_WORD_LENGTH, Math.min(MAX_WORD_LENGTH, Math.floor(options.minWordLength)));
  const counts = new Map<string, { word: string; count: number }>();
  let total = 0;

  for (const match of text.matchAll(WORD)) {
    const raw = match[0];
    if (lengthInCodePoints(raw) < min) continue;

    const key = options.ignoreCase ? raw.toLowerCase() : raw;
    if (options.excludeStopwords && STOPWORDS.has(key.toLowerCase())) continue;

    const existing = counts.get(key);
    if (existing) {
      existing.count += 1;
    } else {
      counts.set(key, { word: key, count: 1 });
    }
    total += 1;
  }

  const all: DensityRow[] = Array.from(counts, ([key, item]) => ({
    word: item.word,
    key,
    count: item.count,
    percent: total === 0 ? 0 : Math.round((item.count / total) * 1000) / 10,
  }));

  all.sort((a, b) => {
    if (a.count !== b.count) return b.count - a.count;
    if (a.key === b.key) return 0;
    return a.key < b.key ? -1 : 1;
  });

  return {
    rows: all.slice(0, TOP_WORDS),
    total,
    unique: all.length,
    truncated: all.length > TOP_WORDS,
  };
}

export interface DensityReportLabels {
  title: string;
  total: string;
  unique: string;
  top: string;
  word: string;
  count: string;
  share: string;
}

/** Render the table as plain text for clipboard and file export. */
export function formatDensityReport(result: DensityResult, labels: DensityReportLabels): string {
  const lines = [
    labels.title,
    `${labels.total}: ${result.total}`,
    `${labels.unique}: ${result.unique}`,
    "",
    labels.top,
    `${labels.word}\t${labels.count}\t${labels.share}`,
  ];
  for (const row of result.rows) {
    lines.push(`${row.word}\t${row.count}\t${row.percent}%`);
  }
  return lines.join("\n");
}
