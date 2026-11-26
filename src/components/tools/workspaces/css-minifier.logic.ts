/**
 * Pure CSS minifier. No DOM, no React, no eval.
 *
 * Text is scanned once. Quoted strings are copied byte for byte, comments are
 * dropped or kept on demand, and whitespace is removed only where CSS token
 * rules allow it. Colour compaction is applied to unquoted text alone.
 */

export type CssMinifierOptions = {
  stripComments: boolean;
  compactColors: boolean;
};

export const DEFAULT_CSS_MINIFIER_OPTIONS: CssMinifierOptions = {
  stripComments: true,
  compactColors: true,
};

export const CSS_MINIFIER_CHAR_LIMIT = 200_000;

export type CssMinifierErrorCode = "TOO_LARGE";

/** Typed, translatable error: the UI decides what wording to show. */
export class CssMinifierError extends Error {
  readonly code: CssMinifierErrorCode;

  constructor(code: CssMinifierErrorCode) {
    super(code);
    this.name = "CssMinifierError";
    this.code = code;
  }
}

export type CssMinifierStats = {
  originalSize: number;
  minifiedSize: number;
  savedPercent: number;
};

export type CssMinifierResult = {
  css: string;
  stats: CssMinifierStats;
};

type Piece = { text: string; protected: boolean };

/** Shorten paired hex digits, or return null when the value cannot shrink. */
function compressHex(hex: string): string | null {
  const lower = hex.toLowerCase();
  if (lower.length === 6) {
    if (lower[0] === lower[1] && lower[2] === lower[3] && lower[4] === lower[5]) {
      return lower[0] + lower[2] + lower[4];
    }
  } else if (lower.length === 8) {
    if (
      lower[0] === lower[1] &&
      lower[2] === lower[3] &&
      lower[4] === lower[5] &&
      lower[6] === lower[7]
    ) {
      return lower[0] + lower[2] + lower[4] + lower[6];
    }
  }
  return null;
}

function compactHexValues(text: string): string {
  return text.replace(/#([0-9a-fA-F]{6}|[0-9a-fA-F]{8})\b/gu, (match, hex: string, offset: number, full: string) => {
    const before = offset > 0 ? full[offset - 1] : "";
    if (before && /[#0-9a-zA-Z_-]/u.test(before)) return match;
    const short = compressHex(hex);
    return short ? `#${short}` : `#${hex.toLowerCase()}`;
  });
}

/** Shorten safe colour literals in text that is known not to be a string. */
export function compactColors(text: string): string {
  const withHex = text.replace(
    /rgb\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*\)/giu,
    (match, red: string, green: string, blue: string) => {
      const channels = [red, green, blue].map(Number);
      if (channels.some((value) => !Number.isInteger(value) || value < 0 || value > 255)) {
        return match;
      }
      return `#${channels.map((value) => value.toString(16).padStart(2, "0")).join("")}`;
    },
  );
  return compactHexValues(withHex);
}

/** Minify CSS text and return the output with size statistics. */
export function minifyCss(input: string, options: CssMinifierOptions): CssMinifierResult {
  const source = input.replace(/\r\n?/gu, "\n");
  if (source.length > CSS_MINIFIER_CHAR_LIMIT) {
    throw new CssMinifierError("TOO_LARGE");
  }

  const originalSize = source.length;
  if (originalSize === 0) {
    return { css: "", stats: { originalSize: 0, minifiedSize: 0, savedPercent: 0 } };
  }

  const pieces: Piece[] = [];
  let pendingSpace = false;
  let braceDepth = 0;

  const current = (): Piece => {
    const last = pieces[pieces.length - 1];
    if (last && !last.protected) return last;
    const fresh: Piece = { text: "", protected: false };
    pieces.push(fresh);
    return fresh;
  };

  const trimTrailingSpace = () => {
    current().text = current().text.replace(/\s+$/u, "");
  };

  const append = (text: string) => {
    current().text += text;
  };

  let index = 0;
  while (index < source.length) {
    const ch = source[index];

    if (ch === "/" && source[index + 1] === "*") {
      const start = index;
      const end = source.indexOf("*/", index + 2);
      index = end === -1 ? source.length : end + 2;
      if (!options.stripComments) {
        pendingSpace = false;
        pieces.push({ text: source.slice(start, index), protected: true });
      }
      continue;
    }

    if (ch === '"' || ch === "'") {
      const start = index;
      const quote = ch;
      index += 1;
      while (index < source.length) {
        if (source[index] === "\\") {
          index += 2;
          continue;
        }
        const done = source[index] === quote;
        index += 1;
        if (done) break;
      }
      const last = current().text.slice(-1);
      if (pendingSpace && last && /[\w$#.\]]/u.test(last)) append(" ");
      pendingSpace = false;
      pieces.push({ text: source.slice(start, index), protected: true });
      continue;
    }

    if (/\s/u.test(ch)) {
      pendingSpace = true;
      index += 1;
      continue;
    }

    if (ch === "{") {
      braceDepth += 1;
      pendingSpace = false;
      trimTrailingSpace();
      append(ch);
      index += 1;
      continue;
    }
    if (ch === "}") {
      braceDepth = Math.max(0, braceDepth - 1);
      pendingSpace = false;
      trimTrailingSpace();
      append(ch);
      index += 1;
      continue;
    }
    if (ch === "(" || ch === ")") {
      pendingSpace = false;
      trimTrailingSpace();
      append(ch);
      index += 1;
      continue;
    }
    if (ch === ";" || ch === "," || ch === ">" || ch === "~") {
      pendingSpace = false;
      trimTrailingSpace();
      append(ch);
      index += 1;
      continue;
    }
    if (ch === ":") {
      // A space before a selector colon can carry meaning, for example
      // `a :hover`. Keep it outside declarations and at-rule headers.
      if (braceDepth > 0) {
        trimTrailingSpace();
      } else if (pendingSpace) {
        const last = current().text.slice(-1);
        if (last && /[\w$#.\]]/u.test(last)) append(" ");
      }
      pendingSpace = false;
      append(ch);
      index += 1;
      continue;
    }

    if (pendingSpace) {
      const last = current().text.slice(-1);
      // Keep one space after operators that need it in calc() and negative
      // values, and after a closing bracket or percent sign.
      if (last && /[\w$#.%+\-)\]]/u.test(last)) append(" ");
    }
    pendingSpace = false;
    append(ch);
    index += 1;
  }

  let css = pieces
    .map((piece) => (piece.protected || !options.compactColors ? piece.text : compactColors(piece.text)))
    .join("");

  css = css
    .replace(/;\}/gu, "}")
    .replace(/;\s*$/u, "")
    .replace(/\s*!\s*important/giu, "!important")
    .trim();

  const minifiedSize = css.length;
  const savedPercent = originalSize === 0
    ? 0
    : Math.max(0, Math.round((1 - minifiedSize / originalSize) * 100));

  return { css, stats: { originalSize, minifiedSize, savedPercent } };
}
