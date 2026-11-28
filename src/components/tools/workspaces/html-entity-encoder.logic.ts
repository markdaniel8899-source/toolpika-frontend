/** Pure HTML entity encoding and decoding. No DOM, no React, no translations. */

export type EntityStyle = "named" | "numeric";
export type EntityMode = "encode" | "decode";

export interface EntityResult {
  output: string;
  replacements: number;
  unknown: string[];
}

export const ENTITY_DEFAULTS: { mode: EntityMode; style: EntityStyle } = {
  mode: "encode",
  style: "named",
};

const NAMED_CODES: Readonly<Record<string, number>> = {
  amp: 38,
  lt: 60,
  gt: 62,
  quot: 34,
  apos: 39,
};

const ENCODE_TABLE: ReadonlyArray<{ char: string; named: string; numeric: string }> = [
  { char: "&", named: "&amp;", numeric: "&#38;" },
  { char: "<", named: "&lt;", numeric: "&#60;" },
  { char: ">", named: "&gt;", numeric: "&#62;" },
  { char: "\"", named: "&quot;", numeric: "&#34;" },
  { char: "'", named: "&apos;", numeric: "&#39;" },
];

const REFERENCE = /&(?:#x[0-9a-f]+|#[0-9]+|[a-z][a-z0-9]{1,31});/giu;
const NAMED_REFERENCE = /&([a-z][a-z0-9]{1,31});/giu;

/** Replace the five characters that matter most in HTML and XML text. */
export function encodeEntities(input: string, style: EntityStyle): EntityResult {
  let output = "";
  let replacements = 0;
  for (const char of Array.from(input)) {
    const entry = ENCODE_TABLE.find((item) => item.char === char);
    if (!entry) {
      output += char;
      continue;
    }
    output += style === "named" ? entry.named : entry.numeric;
    replacements += 1;
  }
  return { output, replacements, unknown: [] };
}

function isUsableCodePoint(codePoint: number): boolean {
  return (
    Number.isInteger(codePoint) &&
    codePoint >= 0 &&
    codePoint <= 0x10ffff &&
    !(codePoint >= 0xd800 && codePoint <= 0xdfff)
  );
}

function decodeReference(reference: string): string | null {
  const body = reference.slice(1, -1);
  if (body.startsWith("#")) {
    const hexadecimal = body[1]?.toLowerCase() === "x";
    const digits = hexadecimal ? body.slice(2) : body.slice(1);
    if (!digits) return null;
    const codePoint = Number.parseInt(digits, hexadecimal ? 16 : 10);
    if (!Number.isFinite(codePoint) || !isUsableCodePoint(codePoint)) return null;
    return String.fromCodePoint(codePoint);
  }
  const code = NAMED_CODES[body.toLowerCase()];
  return code === undefined ? null : String.fromCodePoint(code);
}

function findUnknownNamed(input: string): string[] {
  const found: string[] = [];
  for (const match of input.matchAll(NAMED_REFERENCE)) {
    const name = match[1].toLowerCase();
    if (!(name in NAMED_CODES) && !found.includes(match[0])) {
      found.push(match[0]);
    }
  }
  return found;
}

/** Decode named and numeric references while preserving unrecognised text. */
export function decodeEntities(input: string): EntityResult {
  let replacements = 0;
  const output = input.replace(REFERENCE, (reference) => {
    const decoded = decodeReference(reference);
    if (decoded === null) return reference;
    replacements += 1;
    return decoded;
  });
  return { output, replacements, unknown: findUnknownNamed(input) };
}

export function transformEntities(
  input: string,
  mode: EntityMode,
  style: EntityStyle,
): EntityResult {
  return mode === "encode" ? encodeEntities(input, style) : decodeEntities(input);
}
