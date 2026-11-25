/**
 * Deterministic placeholder-text generator. No DOM, no React, no UI strings.
 * The same options (including the seed) always produce the same text.
 */

export type LoremType = "paragraphs" | "sentences" | "words";

export type LoremOptions = {
  paragraphs: number;
  sentencesPerParagraph: number;
  wordsPerSentence: number;
  type: LoremType;
  startWithLorem: boolean;
  seed: number;
};

export const LOREM_LIMITS = {
  paragraphs: { min: 1, max: 100 },
  sentencesPerParagraph: { min: 1, max: 12 },
  wordsPerSentence: { min: 3, max: 30 },
} as const;

export const DEFAULT_SEED = 1;

export const DEFAULT_LOREM_OPTIONS: LoremOptions = {
  paragraphs: 4,
  sentencesPerParagraph: 4,
  wordsPerSentence: 12,
  type: "paragraphs",
  startWithLorem: true,
  seed: DEFAULT_SEED,
};

/** Preset used by the "Try sample" action and the worked example on the page. */
export const SAMPLE_LOREM_OPTIONS: LoremOptions = {
  paragraphs: 2,
  sentencesPerParagraph: 3,
  wordsPerSentence: 10,
  type: "paragraphs",
  startWithLorem: true,
  seed: DEFAULT_SEED,
};

const VOCABULARY = (
  "lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod " +
  "tempor incididunt ut labore et dolore magna aliqua enim ad minim veniam " +
  "quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo " +
  "consequat duis aute irure in reprehenderit voluptate velit esse cillum " +
  "eu fugiat nulla pariatur excepteur sint occaecat cupidatat non proident " +
  "sunt culpa qui officia deserunt mollit anim id est laborum"
).split(" ");

/** mulberry32: a small, fast, seedable pseudo-random generator. */
function createRandom(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

function bounded(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min;
  return Math.min(max, Math.max(min, Math.trunc(value)));
}

function pickWords(random: () => number, amount: number): string[] {
  const words: string[] = [];
  for (let index = 0; index < amount; index += 1) {
    words.push(VOCABULARY[Math.floor(random() * VOCABULARY.length)]);
  }
  return words;
}

function buildSentence(
  random: () => number,
  target: number,
  forceLorem: boolean,
): string {
  const length = bounded(Math.round(target * (0.72 + random() * 0.56)), 3, 30);
  const words = pickWords(random, length);

  if (forceLorem) {
    words[0] = "Lorem";
    words[1] = "ipsum";
  }

  const parts = words.map((word, index) => {
    let piece = word;
    if (forceLorem && (index === 4 || index === 7) && index < words.length - 1) {
      piece += ",";
    } else if (index > 2 && index < words.length - 1 && random() < 0.1) {
      piece += ",";
    }
    return piece;
  });

  return `${parts.join(" ")}.`;
}

/** Count words the same way a whitespace-based counter does. */
export function countWords(text: string): number {
  const trimmed = text.trim();
  return trimmed ? trimmed.split(/\s+/u).length : 0;
}

/** Generate placeholder text for the chosen type, count and seed. */
export function generateLorem(options: LoremOptions): string {
  const random = createRandom(bounded(options.seed, 0, 0xffffffff));
  const paragraphs = bounded(
    options.paragraphs,
    LOREM_LIMITS.paragraphs.min,
    LOREM_LIMITS.paragraphs.max,
  );
  const sentences = bounded(
    options.sentencesPerParagraph,
    LOREM_LIMITS.sentencesPerParagraph.min,
    LOREM_LIMITS.sentencesPerParagraph.max,
  );
  const words = bounded(
    options.wordsPerSentence,
    LOREM_LIMITS.wordsPerSentence.min,
    LOREM_LIMITS.wordsPerSentence.max,
  );
  const type: LoremType =
    options.type === "sentences" || options.type === "words"
      ? options.type
      : "paragraphs";
  const start = Boolean(options.startWithLorem);

  if (type === "words") {
    const picked = pickWords(random, words);
    if (start) {
      picked[0] = "Lorem";
      picked[1] = "ipsum";
    }
    return picked.join(" ");
  }

  if (type === "sentences") {
    return Array.from({ length: sentences }, (_, index) =>
      buildSentence(random, words, start && index === 0),
    ).join(" ");
  }

  return Array.from({ length: paragraphs }, (_, paragraph) =>
    Array.from({ length: sentences }, (_, sentence) =>
      buildSentence(random, words, start && paragraph === 0 && sentence === 0),
    ).join(" "),
  ).join("\n\n");
}
