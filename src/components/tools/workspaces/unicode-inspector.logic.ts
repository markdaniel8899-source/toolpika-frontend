/** Pure Unicode inspection and cleaning. No DOM, no React, no translations. */

export type UnicodeCategory = "zeroWidth" | "nonBreaking" | "directional" | "control";

export interface StripOptions {
  zeroWidth: boolean;
  nonBreaking: boolean;
  directional: boolean;
  control: boolean;
}

export interface CharacterInfo {
  index: number;
  codePoint: number;
  hex: string;
  name: string;
  category: UnicodeCategory | null;
  char: string;
}

export interface Inspection {
  characters: CharacterInfo[];
  issues: CharacterInfo[];
  cleaned: string;
  total: number;
  flagged: number;
  unique: number;
}

export const UNICODE_DEFAULTS: StripOptions = {
  zeroWidth: true,
  nonBreaking: true,
  directional: true,
  control: true,
};

const NAMES: Readonly<Record<number, string>> = {
  0x00ad: "Soft hyphen",
  0x00a0: "Non breaking space",
  0x061c: "Arabic letter mark",
  0x180e: "Mongolian vowel separator",
  0x2000: "En quad",
  0x2001: "Em quad",
  0x2002: "En space",
  0x2003: "Em space",
  0x2004: "Three per em space",
  0x2005: "Four per em space",
  0x2006: "Six per em space",
  0x2007: "Figure space",
  0x2008: "Punctuation space",
  0x2009: "Thin space",
  0x200a: "Hair space",
  0x200b: "Zero width space",
  0x200c: "Zero width non joiner",
  0x200d: "Zero width joiner",
  0x200e: "Left to right mark",
  0x200f: "Right to left mark",
  0x202a: "Left to right embedding",
  0x202b: "Right to left embedding",
  0x202c: "Pop direction formatting",
  0x202d: "Left to right override",
  0x202e: "Right to left override",
  0x202f: "Narrow non breaking space",
  0x2060: "Word joiner",
  0x2061: "Function application",
  0x2062: "Invisible times",
  0x2063: "Invisible separator",
  0x2064: "Invisible plus",
  0x2066: "Left to right isolate",
  0x2067: "Right to left isolate",
  0x2068: "First strong isolate",
  0x2069: "Pop direction isolate",
  0xfeff: "Byte order mark",
};

const ZERO_WIDTH = new Set<number>([
  0x00ad, 0x180e, 0x200b, 0x200c, 0x200d, 0x2060, 0x2061, 0x2062, 0x2063, 0x2064, 0xfeff,
]);
const NON_BREAKING = new Set<number>([0x00a0, 0x2007, 0x202f]);
const DIRECTIONAL = new Set<number>([
  0x061c, 0x200e, 0x200f, 0x202a, 0x202b, 0x202c, 0x202d, 0x202e, 0x2066, 0x2067, 0x2068, 0x2069,
]);

/** Classify a code point into one of the four inspectable groups. */
export function classifyCodePoint(codePoint: number): UnicodeCategory | null {
  if (ZERO_WIDTH.has(codePoint)) return "zeroWidth";
  if (NON_BREAKING.has(codePoint)) return "nonBreaking";
  if (DIRECTIONAL.has(codePoint)) return "directional";
  if ((codePoint >= 0 && codePoint <= 0x1f && codePoint !== 9 && codePoint !== 10 && codePoint !== 13) || codePoint === 0x7f) {
    return "control";
  }
  return null;
}

export function formatCodePoint(codePoint: number): string {
  return `U+${codePoint.toString(16).toUpperCase().padStart(4, "0")}`;
}

function nameFor(codePoint: number): string {
  return NAMES[codePoint] ?? formatCodePoint(codePoint);
}

/** Scan a string, report flagged code points and build a cleaned copy. */
export function inspectUnicode(input: string, strip: StripOptions): Inspection {
  const characters: CharacterInfo[] = [];
  const issues: CharacterInfo[] = [];
  let cleaned = "";

  Array.from(input).forEach((char, index) => {
    const codePoint = char.codePointAt(0) ?? 0;
    const category = classifyCodePoint(codePoint);
    const info: CharacterInfo = {
      index,
      codePoint,
      hex: formatCodePoint(codePoint),
      name: nameFor(codePoint),
      category,
      char,
    };
    characters.push(info);
    if (category) issues.push(info);

    if (!category || !strip[category]) {
      cleaned += char;
    } else if (category === "nonBreaking") {
      cleaned += " ";
    }
  });

  return {
    characters,
    issues,
    cleaned,
    total: characters.length,
    flagged: issues.length,
    unique: new Set(issues.map((issue) => issue.codePoint)).size,
  };
}
