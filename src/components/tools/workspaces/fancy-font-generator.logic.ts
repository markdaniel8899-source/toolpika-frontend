/**
 * Pure Unicode styling rules for the Fancy Font Generator.
 * No browser APIs, no React and no network access live in this file.
 */

export type StyleId =
  | "bold"
  | "italic"
  | "boldItalic"
  | "cursiveScript"
  | "boldScript"
  | "fraktur"
  | "monospace"
  | "doubleStruck"
  | "bubble"
  | "square"
  | "smallCaps"
  | "wideText"
  | "strikethrough"
  | "upsideDown";

export type FilterId = "all" | "serif" | "modern" | "playful";
export type StyleGroup = Exclude<FilterId, "all">;

export const STYLES: readonly StyleId[] = [
  "bold",
  "italic",
  "boldItalic",
  "cursiveScript",
  "boldScript",
  "fraktur",
  "monospace",
  "doubleStruck",
  "bubble",
  "square",
  "smallCaps",
  "wideText",
  "strikethrough",
  "upsideDown",
];

export const FILTERS: readonly FilterId[] = ["all", "serif", "modern", "playful"];

/** Fixed preview source, so the cards look identical on every visit. */
export const SAMPLE_TEXT = "Hello world";

/** Short enough for a card without wrapping on a narrow phone. */
export const CARD_LIMIT = 22;

const STYLE_GROUPS: Record<StyleId, StyleGroup> = {
  bold: "serif",
  italic: "serif",
  boldItalic: "serif",
  cursiveScript: "serif",
  boldScript: "serif",
  fraktur: "serif",
  monospace: "modern",
  doubleStruck: "modern",
  smallCaps: "modern",
  wideText: "modern",
  bubble: "playful",
  square: "playful",
  strikethrough: "playful",
  upsideDown: "playful",
};

const UPPER = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const LOWER = "abcdefghijklmnopqrstuvwxyz";
const DIGITS = "0123456789";

function codePoints(start: number, length: number): string {
  return Array.from({ length }, (_, index) => String.fromCodePoint(start + index)).join("");
}

function shifted(start: number, length: number, shift: number): string {
  return Array.from({ length }, (_, index) => String.fromCharCode(start + index + shift)).join("");
}

function replaceGlyph(source: string, index: number, codePoint: number): string {
  const chars = Array.from(source);
  chars[index] = String.fromCodePoint(codePoint);
  return chars.join("");
}

function makeMap(from: string, to: string): Record<string, string> {
  const map: Record<string, string> = {};
  const source = Array.from(from);
  const target = Array.from(to);
  source.forEach((char, index) => {
    map[char] = target[index] ?? char;
  });
  return map;
}

function styleMap(upper: string, lower: string, digits: string = DIGITS): Record<string, string> {
  return { ...makeMap(UPPER, upper), ...makeMap(LOWER, lower), ...makeMap(DIGITS, digits) };
}

// Script alphabets have a few holes in Unicode, so their capitals and small
// letters are listed explicitly instead of generated from a single range.
const SCRIPT_UPPER = "𝒜𝐵𝒞𝒟𝐸𝐹𝒢𝐻𝐼𝒥𝒦𝐿𝑀𝒩𝒪𝒫𝒬𝑅𝒮𝒯𝒰𝒱𝒲𝒳𝒴𝒵";
const SCRIPT_LOWER = "𝒶𝒷𝒸𝒹ℯ𝒻ℊ𝒽𝒾𝒿𝓀𝓁𝓂𝓃ℴ𝓅𝓆𝓇𝓈𝓉𝓊𝓋𝓌𝓍𝓎𝓏";
const FRAKTUR_UPPER = "𝔄𝔅ℭ𝔇𝔈𝔉𝔊ℌℑ𝔍𝔎𝔏𝔐𝔑𝔒𝔓𝔔ℜ𝔖𝔗𝔘𝔙𝔚𝔛𝔜ℨ";
const DOUBLE_STRUCK_UPPER = "𝔸𝔹ℂ𝔻𝔼𝔽𝔾ℍ𝕀𝕁𝕂𝕃𝕄ℕ𝕆ℙℚℝ𝕊𝕋𝕌𝕍𝕎𝕏𝕐ℤ";
const SMALL_CAPS_LOWER = "ᴀʙᴄᴅᴇꜰɢʜɪᴊᴋʟᴍɴᴏᴘǫʀꜱᴛᴜᴠᴡxʏᴢ";
const SQUARE_UPPER = codePoints(0x1f130, 26);

const LETTER_MAPS: Partial<Record<StyleId, Record<string, string>>> = {
  bold: styleMap(codePoints(0x1d400, 26), codePoints(0x1d41a, 26), codePoints(0x1d7ce, 10)),
  italic: styleMap(codePoints(0x1d434, 26), replaceGlyph(codePoints(0x1d44e, 26), 7, 0x210e)),
  boldItalic: styleMap(codePoints(0x1d468, 26), codePoints(0x1d482, 26)),
  cursiveScript: styleMap(SCRIPT_UPPER, SCRIPT_LOWER),
  boldScript: styleMap(codePoints(0x1d4d0, 26), codePoints(0x1d4ea, 26)),
  fraktur: styleMap(FRAKTUR_UPPER, codePoints(0x1d51e, 26)),
  monospace: styleMap(codePoints(0x1d670, 26), codePoints(0x1d68a, 26), codePoints(0x1d7f6, 10)),
  doubleStruck: styleMap(DOUBLE_STRUCK_UPPER, codePoints(0x1d552, 26), codePoints(0x1d7d8, 10)),
  bubble: styleMap(codePoints(0x24b6, 26), codePoints(0x24d0, 26), "⓪①②③④⑤⑥⑦⑧⑨"),
  // Squared capitals are the only squared letters; lowercase input uses them too.
  square: styleMap(SQUARE_UPPER, SQUARE_UPPER),
  smallCaps: styleMap(UPPER, SMALL_CAPS_LOWER),
  wideText: styleMap(shifted(0x41, 26, 0xfee0), shifted(0x61, 26, 0xfee0), shifted(0x30, 10, 0xfee0)),
};

const FLIP_MAP: Record<string, string> = {
  a: "ɐ", b: "q", c: "Ɔ", d: "p", e: "ə", f: "ɟ", g: "ƃ", h: "ɥ", i: "ı", j: "ɾ",
  k: "κ", l: "ʟ", m: "ɯ", n: "u", o: "o", p: "d", q: "b", r: "ɹ", s: "s", t: "ŧ",
  u: "n", v: "Λ", w: "ʍ", x: "x", y: "λ", z: "z",
  A: "∀", B: "ᙠ", C: "Ɔ", D: "ᗡ", E: "Ǝ", F: "ᖷ", G: "⅁", H: "H", I: "I", J: "ſ",
  K: "ʞ", L: "˥", M: "W", N: "N", O: "O", P: "d", Q: "Ә", R: "ᴚ", S: "S", T: "⊥",
  U: "U", V: "Λ", W: "M", X: "X", Y: "⅄", Z: "Z",
  "0": "0", "1": "Ɩ", "2": "ᄅ", "3": "Ɛ", "4": "ㄣ", "5": "ϛ", "6": "9", "7": "ㄥ",
  "8": "8", "9": "6",
  ".": "˙", ",": "'", "?": "¿", "!": "¡", "'": ",", "(": ")", ")": "(",
  "[": "]", "]": "[", "{": "}", "}": "{", "<": ">", ">": "<", "_": "‾", "&": "⅋",
};

function applyMap(text: string, map: Record<string, string>): string {
  return Array.from(text)
    .map((char) => map[char] ?? char)
    .join("");
}

function strikeThrough(text: string): string {
  return Array.from(text)
    .map((char) => `${char}\u0336`)
    .join("");
}

function flipText(text: string): string {
  return Array.from(text)
    .reverse()
    .map((char) => FLIP_MAP[char] ?? char)
    .join("");
}

/** Map plain text to one of the fourteen Unicode styles. */
export function transformText(text: string, style: StyleId): string {
  const map = LETTER_MAPS[style];
  if (map) return applyMap(text, map);
  if (style === "strikethrough") return strikeThrough(text);
  return flipText(text);
}

/** Deterministic styled preview used before the visitor types anything. */
export function getStyleSample(style: StyleId): string {
  return transformText(SAMPLE_TEXT, style);
}

export function groupForStyle(style: StyleId): StyleGroup {
  return STYLE_GROUPS[style];
}

/** Styles that belong to a filter pill. "all" keeps the original card order. */
export function getVisibleStyles(filter: FilterId): readonly StyleId[] {
  if (filter === "all") return STYLES;
  return STYLES.filter((style) => STYLE_GROUPS[style] === filter);
}

/** Code point count, so emoji and astral symbols count as one character. */
export function countCharacters(text: string): number {
  return Array.from(text).length;
}

/** Short card preview that never breaks a single-line layout. */
export function truncateForCard(text: string, limit: number = CARD_LIMIT): string {
  const chars = Array.from(text);
  return chars.length > limit ? `${chars.slice(0, limit).join("")}…` : text;
}
