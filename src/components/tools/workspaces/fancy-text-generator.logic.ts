/**
 * Pure Unicode styling tables for the fancy text generator.
 * No DOM, React, storage, network, timer or analytics access lives here.
 */

export const MAX_TEXT_LENGTH = 400;

export const STYLE_IDS = [
  "boldSerif",
  "italicSerif",
  "boldItalic",
  "script",
  "boldScript",
  "monospace",
  "fraktur",
  "boldFraktur",
  "doubleStruck",
  "sansSerif",
  "sansSerifBold",
  "sansSerifItalic",
  "sansSerifBoldItalic",
  "circled",
  "squared",
  "strikethrough",
] as const;

export type FancyStyleId = (typeof STYLE_IDS)[number];

export type FancyErrorCode = "EMPTY_TEXT" | "TOO_LONG" | "NO_LETTERS";

export interface FancyVariant {
  id: FancyStyleId;
  text: string;
}

export interface FancyResult {
  variants: FancyVariant[];
  inputCharacters: number;
  mappedCharacters: number;
  error?: { code: FancyErrorCode };
}

const UPPER = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const LOWER = "abcdefghijklmnopqrstuvwxyz";
const DIGITS = "0123456789";

type GlyphMap = Map<string, string>;

function alphabetMap(
  upperStart: number,
  lowerStart: number,
  digitStart?: number,
  overrides: Readonly<Record<string, string>> = {},
): GlyphMap {
  const table: GlyphMap = new Map<string, string>();
  Array.from(UPPER).forEach((letter, index) => {
    table.set(letter, String.fromCodePoint(upperStart + index));
  });
  Array.from(LOWER).forEach((letter, index) => {
    table.set(letter, String.fromCodePoint(lowerStart + index));
  });
  if (digitStart !== undefined) {
    Array.from(DIGITS).forEach((digit, index) => {
      table.set(digit, String.fromCodePoint(digitStart + index));
    });
  }
  Object.entries(overrides).forEach(([letter, glyph]) => table.set(letter, glyph));
  return table;
}

/** Mathematical script capitals include reserved slots and letterlike symbols. */
const SCRIPT_UPPER: GlyphMap = new Map<string, string>([
  ["A", "\u{1D49C}"], ["B", "\u{212C}"], ["C", "\u{1D49E}"], ["D", "\u{1D49F}"],
  ["E", "\u{2130}"], ["F", "\u{2131}"], ["G", "\u{1D4A2}"], ["H", "\u{210B}"],
  ["I", "\u{2110}"], ["J", "\u{1D4A5}"], ["K", "\u{1D4A6}"], ["L", "\u{2112}"],
  ["M", "\u{2133}"], ["N", "\u{1D4A9}"], ["O", "\u{1D4AB}"], ["P", "\u{1D4AC}"],
  ["Q", "\u{1D4AE}"], ["R", "\u{211B}"], ["S", "\u{1D4AF}"], ["T", "\u{1D4B0}"],
  ["U", "\u{1D4B1}"], ["V", "\u{1D4B2}"], ["W", "\u{1D4B3}"], ["X", "\u{1D4B4}"],
  ["Y", "\u{1D4B5}"], ["Z", "\u{2128}"],
]);

/** Lowercase script also uses letterlike symbols for e, g and o. */
const SCRIPT_LOWER: GlyphMap = new Map<string, string>([
  ["a", "\u{1D4B6}"], ["b", "\u{1D4B7}"], ["c", "\u{1D4B8}"], ["d", "\u{1D4B9}"],
  ["e", "\u{212F}"], ["f", "\u{1D4BB}"], ["g", "\u{210A}"], ["h", "\u{1D4BD}"],
  ["i", "\u{1D4BE}"], ["j", "\u{1D4BF}"], ["k", "\u{1D4C0}"], ["l", "\u{1D4C1}"],
  ["m", "\u{1D4C2}"], ["n", "\u{1D4C3}"], ["o", "\u{2134}"], ["p", "\u{1D4C5}"],
  ["q", "\u{1D4C6}"], ["r", "\u{1D4C7}"], ["s", "\u{1D4C8}"], ["t", "\u{1D4C9}"],
  ["u", "\u{1D4CA}"], ["v", "\u{1D4CB}"], ["w", "\u{1D4CC}"], ["x", "\u{1D4CD}"],
  ["y", "\u{1D4CE}"], ["z", "\u{1D4CF}"],
]);

const SCRIPT: GlyphMap = new Map<string, string>([...SCRIPT_UPPER, ...SCRIPT_LOWER]);

function enclosedMap(): GlyphMap {
  const table: GlyphMap = new Map<string, string>();
  Array.from(UPPER).forEach((letter, index) => {
    table.set(letter, String.fromCodePoint(0x24b6 + index));
  });
  Array.from(LOWER).forEach((letter, index) => {
    table.set(letter, String.fromCodePoint(0x24d0 + index));
  });
  Array.from(DIGITS).forEach((digit, index) => {
    table.set(digit, index === 0 ? "\u24ea" : String.fromCodePoint(0x245f + index));
  });
  return table;
}

function squaredMap(): GlyphMap {
  const table: GlyphMap = new Map<string, string>();
  Array.from(UPPER).forEach((letter, index) => {
    table.set(letter, String.fromCodePoint(0x1f130 + index));
  });
  return table;
}

const STYLE_MAPS: Record<FancyStyleId, GlyphMap> = {
  boldSerif: alphabetMap(0x1d400, 0x1d41a, 0x1d7ce),
  italicSerif: alphabetMap(0x1d434, 0x1d44e, undefined, { h: "\u210e" }),
  boldItalic: alphabetMap(0x1d468, 0x1d482),
  script: SCRIPT,
  boldScript: alphabetMap(0x1d4d0, 0x1d4ea),
  monospace: alphabetMap(0x1d670, 0x1d68a, 0x1d7f6),
  fraktur: alphabetMap(0x1d504, 0x1d51e, undefined, {
    C: "\u212d", H: "\u210c", I: "\u2111", R: "\u211c", Z: "\u2128",
  }),
  boldFraktur: alphabetMap(0x1d56c, 0x1d586),
  doubleStruck: alphabetMap(0x1d538, 0x1d552, 0x1d7d8, {
    C: "\u2102", H: "\u210d", N: "\u2115", P: "\u2119", Q: "\u211a", R: "\u211d", Z: "\u2124",
  }),
  sansSerif: alphabetMap(0x1d5a0, 0x1d5ba, 0x1d7e2),
  sansSerifBold: alphabetMap(0x1d5d4, 0x1d5ee, 0x1d7ec),
  sansSerifItalic: alphabetMap(0x1d608, 0x1d622),
  sansSerifBoldItalic: alphabetMap(0x1d63c, 0x1d656),
  circled: enclosedMap(),
  squared: squaredMap(),
  strikethrough: new Map<string, string>(),
};

const LATIN = /[A-Za-z0-9]/u;
const STRIKE = "\u0336";

interface StyledText {
  text: string;
  count: number;
}

/** Apply one fixed mapping. Unknown characters pass through unchanged. */
export function transformText(text: string, style: FancyStyleId): StyledText {
  let output = "";
  let count = 0;
  const table = STYLE_MAPS[style];

  for (const character of Array.from(text)) {
    let glyph: string | undefined;
    if (style === "strikethrough") {
      glyph = LATIN.test(character) ? `${character}${STRIKE}` : undefined;
    } else {
      glyph = table.get(character);
    }

    if (glyph) {
      output += glyph;
      count += 1;
    } else {
      output += character;
    }
  }

  return { text: output, count };
}

/** Build every styled variant plus inline diagnostics for the input. */
export function buildFancyResult(text: string): FancyResult {
  const inputCharacters = Array.from(text).length;
  const base: FancyResult = { variants: [], inputCharacters, mappedCharacters: 0 };

  if (inputCharacters === 0) return base;
  if (text.trim().length === 0) return { ...base, error: { code: "EMPTY_TEXT" } };
  if (inputCharacters > MAX_TEXT_LENGTH) return { ...base, error: { code: "TOO_LONG" } };

  const variants = STYLE_IDS.map((id) => ({ id, text: transformText(text, id).text }));
  const mappedCharacters = transformText(text, "boldSerif").count;

  if (mappedCharacters === 0) {
    return { ...base, variants, error: { code: "NO_LETTERS" } };
  }

  return { variants, inputCharacters, mappedCharacters };
}
