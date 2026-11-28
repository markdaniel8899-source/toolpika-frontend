/**
 * Pure Unicode styling tables for the fancy text generator.
 * No DOM, React, storage, network, timer or analytics access lives here.
 */

export const MAX_TEXT_LENGTH = 400;

export const STYLE_IDS = [
  "bold",
  "italic",
  "monospace",
  "strikethrough",
  "script",
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

function range(start: number, alphabet: string): Map<string, string> {
  const table = new Map<string, string>();
  Array.from(alphabet).forEach((letter, index) => {
    table.set(letter, String.fromCodePoint(start + index));
  });
  return table;
}

const BOLD_UPPER = range(0x1d400, UPPER);
const BOLD_LOWER = range(0x1d41a, LOWER);
const BOLD_DIGITS = range(0x1d7ce, DIGITS);

const ITALIC_UPPER = range(0x1d434, UPPER);
const ITALIC_LOWER = range(0x1d44e, LOWER);
ITALIC_LOWER.set("h", "\u210e");

const MONO_UPPER = range(0x1d670, UPPER);
const MONO_LOWER = range(0x1d68a, LOWER);
const MONO_DIGITS = range(0x1d7f6, DIGITS);

/** Mathematical script capitals include reserved slots and letterlike symbols. */
const SCRIPT_UPPER = new Map<string, string>([
  ["A", "\u{1D49C}"], ["B", "\u{212C}"], ["C", "\u{1D49E}"], ["D", "\u{1D49F}"],
  ["E", "\u{2130}"], ["F", "\u{2131}"], ["G", "\u{1D4A2}"], ["H", "\u{210B}"],
  ["I", "\u{2110}"], ["J", "\u{1D4A5}"], ["K", "\u{1D4A6}"], ["L", "\u{2112}"],
  ["M", "\u{2133}"], ["N", "\u{1D4A9}"], ["O", "\u{1D4AB}"], ["P", "\u{1D4AC}"],
  ["Q", "\u{1D4AE}"], ["R", "\u{211B}"], ["S", "\u{1D4AF}"], ["T", "\u{1D4B0}"],
  ["U", "\u{1D4B1}"], ["V", "\u{1D4B2}"], ["W", "\u{1D4B3}"], ["X", "\u{1D4B4}"],
  ["Y", "\u{1D4B5}"], ["Z", "\u{2128}"],
]);

/** Lowercase script also uses letterlike symbols for e, g and o. */
const SCRIPT_LOWER = new Map<string, string>([
  ["a", "\u{1D4B6}"], ["b", "\u{1D4B7}"], ["c", "\u{1D4B8}"], ["d", "\u{1D4B9}"],
  ["e", "\u{212F}"], ["f", "\u{1D4BB}"], ["g", "\u{210A}"], ["h", "\u{1D4BD}"],
  ["i", "\u{1D4BE}"], ["j", "\u{1D4BF}"], ["k", "\u{1D4C0}"], ["l", "\u{1D4C1}"],
  ["m", "\u{1D4C2}"], ["n", "\u{1D4C3}"], ["o", "\u{2134}"], ["p", "\u{1D4C5}"],
  ["q", "\u{1D4C6}"], ["r", "\u{1D4C7}"], ["s", "\u{1D4C8}"], ["t", "\u{1D4C9}"],
  ["u", "\u{1D4CA}"], ["v", "\u{1D4CB}"], ["w", "\u{1D4CC}"], ["x", "\u{1D4CD}"],
  ["y", "\u{1D4CE}"], ["z", "\u{1D4CF}"],
]);

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

  for (const character of Array.from(text)) {
    let glyph: string | undefined;

    switch (style) {
      case "bold":
        glyph = BOLD_UPPER.get(character) ?? BOLD_LOWER.get(character) ?? BOLD_DIGITS.get(character);
        break;
      case "italic":
        glyph = ITALIC_UPPER.get(character) ?? ITALIC_LOWER.get(character);
        break;
      case "monospace":
        glyph = MONO_UPPER.get(character) ?? MONO_LOWER.get(character) ?? MONO_DIGITS.get(character);
        break;
      case "script":
        glyph = SCRIPT_UPPER.get(character) ?? SCRIPT_LOWER.get(character);
        break;
      case "strikethrough":
        glyph = LATIN.test(character) ? `${character}${STRIKE}` : undefined;
        break;
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

/** Build all five styled variants plus inline diagnostics for the input. */
export function buildFancyResult(text: string): FancyResult {
  const inputCharacters = Array.from(text).length;
  const base: FancyResult = { variants: [], inputCharacters, mappedCharacters: 0 };

  if (inputCharacters === 0) return base;
  if (text.trim().length === 0) return { ...base, error: { code: "EMPTY_TEXT" } };
  if (inputCharacters > MAX_TEXT_LENGTH) return { ...base, error: { code: "TOO_LONG" } };

  const variants = STYLE_IDS.map((id) => ({ id, text: transformText(text, id).text }));
  const mappedCharacters = transformText(text, "bold").count;

  if (mappedCharacters === 0) {
    return { ...base, variants, error: { code: "NO_LETTERS" } };
  }

  return { variants, inputCharacters, mappedCharacters };
}
