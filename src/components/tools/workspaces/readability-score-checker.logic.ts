/**
 * Pure readability estimates. No DOM, no React, no UI strings.
 *
 * The formulas are the published Flesch Reading Ease and Flesch-Kincaid grade
 * formulas. Word and syllable counting is a deterministic English heuristic,
 * so every number is an estimate rather than a measurement of a reader.
 */

export type FleschBand =
  | "veryEasy"
  | "easy"
  | "standard"
  | "fairlyDifficult"
  | "difficult"
  | "veryDifficult";

export type GradeBand = "upTo8" | "grades9to12" | "grade13Plus";

export type ReadabilityErrorCode = "TOO_LARGE";

/** Typed error so the UI can show its own translated, actionable message. */
export class ReadabilityInputError extends Error {
  readonly code: ReadabilityErrorCode;

  constructor(code: ReadabilityErrorCode) {
    super(code);
    this.name = "ReadabilityInputError";
    this.code = code;
  }
}

export const READABILITY_MAX_CHARS = 120_000;

export interface ReadabilityResult {
  /** Flesch Reading Ease, clamped to 0-100 and rounded to one decimal. */
  flesch: number;
  /** Flesch-Kincaid grade, clamped to 0-18 and rounded to one decimal. */
  grade: number;
  words: number;
  sentences: number;
  syllables: number;
  avgWordsPerSentence: number;
  avgSyllablesPerWord: number;
  band: FleschBand;
  gradeBand: GradeBand;
  /** True when no terminal punctuation was found and the text is one sentence. */
  assumedSingleSentence: boolean;
}

function round1(value: number): number {
  return Math.round(value * 10) / 10;
}

function clamp(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min;
  return Math.min(max, Math.max(min, value));
}

/**
 * Vowel-group syllable estimate for one token. A trailing silent e is dropped,
 * a leading y is treated as a vowel, and every token gets at least one beat.
 * Tokens without Latin letters (digits, other scripts) count as one beat.
 */
export function countSyllables(token: string): number {
  const word = token.toLowerCase().replace(/[^a-z]/gu, "");
  if (!word) return 1;
  if (word.length <= 3) return 1;

  const trimmed = word
    .replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/gu, "")
    .replace(/^y/gu, "");
  const groups = trimmed.match(/[aeiouy]{1,2}/gu);
  return Math.max(1, groups ? groups.length : 1);
}

export function fleschBand(score: number): FleschBand {
  if (score >= 90) return "veryEasy";
  if (score >= 80) return "easy";
  if (score >= 60) return "standard";
  if (score >= 50) return "fairlyDifficult";
  if (score >= 30) return "difficult";
  return "veryDifficult";
}

export function gradeBand(grade: number): GradeBand {
  if (grade <= 8) return "upTo8";
  if (grade <= 12) return "grades9to12";
  return "grade13Plus";
}

/** Estimate Flesch Reading Ease and Flesch-Kincaid grade from plain text. */
export function analyzeReadability(text: string): ReadabilityResult {
  if (text.length > READABILITY_MAX_CHARS) {
    throw new ReadabilityInputError("TOO_LARGE");
  }

  const tokens = text.trim() ? text.trim().split(/\s+/u) : [];
  let words = 0;
  let syllables = 0;

  for (const token of tokens) {
    const core = token.replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, "");
    if (!core) continue;
    words += 1;
    syllables += countSyllables(core);
  }

  const parts = text.split(/[.!?…]+/u).filter((part) => part.trim().length > 0);
  const sentences = Math.max(1, parts.length);
  const assumedSingleSentence = words > 0 && !/[.!?…]/u.test(text);

  if (words === 0) {
    return {
      flesch: 0,
      grade: 0,
      words: 0,
      sentences: 0,
      syllables: 0,
      avgWordsPerSentence: 0,
      avgSyllablesPerWord: 0,
      band: "veryDifficult",
      gradeBand: "upTo8",
      assumedSingleSentence: false,
    };
  }

  const avgWordsPerSentence = words / sentences;
  const avgSyllablesPerWord = syllables / words;
  const rawFlesch =
    206.835 - 1.015 * avgWordsPerSentence - 84.6 * avgSyllablesPerWord;
  const rawGrade =
    0.39 * avgWordsPerSentence + 11.8 * avgSyllablesPerWord - 15.59;
  const flesch = round1(clamp(rawFlesch, 0, 100));
  const grade = round1(clamp(rawGrade, 0, 18));

  return {
    flesch,
    grade,
    words,
    sentences,
    syllables,
    avgWordsPerSentence: round1(avgWordsPerSentence),
    avgSyllablesPerWord: round1(avgSyllablesPerWord),
    band: fleschBand(flesch),
    gradeBand: gradeBand(grade),
    assumedSingleSentence,
  };
}
