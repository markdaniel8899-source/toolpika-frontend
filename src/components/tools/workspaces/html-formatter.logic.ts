/**
 * Pure, string-only HTML pretty printer. No DOM, no parsing library, no React,
 * no execution of pasted markup. Tags are matched as text and re-indented.
 */

export type IndentSize = "2" | "4";

export type HtmlFormatErrorCode = "TOO_LARGE";

/** Typed error so the workspace can show its own translated, actionable text. */
export class HtmlFormatError extends Error {
  readonly code: HtmlFormatErrorCode;

  constructor(code: HtmlFormatErrorCode) {
    super(code);
    this.name = "HtmlFormatError";
    this.code = code;
  }
}

export const HTML_MAX_CHARS = 100_000;

export type HtmlFormatOptions = {
  indentSize: IndentSize;
  escapeMarkup: boolean;
};

export const DEFAULT_HTML_FORMAT_OPTIONS: HtmlFormatOptions = {
  indentSize: "2",
  escapeMarkup: false,
};

export interface HtmlFormatResult {
  output: string;
  tagCount: number;
  lineCount: number;
  /** Open tags left unmatched at the end, as a best-effort warning. */
  unclosed: number;
}

const VOID_TAGS = new Set([
  "area",
  "base",
  "br",
  "col",
  "embed",
  "hr",
  "img",
  "input",
  "link",
  "meta",
  "param",
  "source",
  "track",
  "wbr",
]);

const TOKEN_PATTERN =
  /<!--[\s\S]*?-->|<!doctype[^>]*>|<\/[A-Za-z][^>]*>|<[A-Za-z][^>]*>/giu;

function escapeMarkupText(value: string): string {
  return value
    .replace(/&/gu, "&amp;")
    .replace(/</gu, "&lt;")
    .replace(/>/gu, "&gt;");
}

/** Escape only the four characters the browser reads as markup or entities. */
export function escapeForDisplay(value: string): string {
  return escapeMarkupText(value);
}

/**
 * Re-indent HTML using token boundaries. Text between tags is collapsed to a
 * single line; scripts are treated as ordinary text and never evaluated.
 */
export function formatHtml(
  input: string,
  options: HtmlFormatOptions,
): HtmlFormatResult {
  if (input.length > HTML_MAX_CHARS) {
    throw new HtmlFormatError("TOO_LARGE");
  }
  if (!input.trim()) {
    return { output: "", tagCount: 0, lineCount: 0, unclosed: 0 };
  }

  const pad = " ".repeat(Number(options.indentSize));
  const lines: string[] = [];
  let depth = 0;
  let tagCount = 0;
  let cursor = 0;

  const addText = (raw: string) => {
    const text = raw.replace(/\s+/gu, " ").trim();
    if (text) lines.push(pad.repeat(depth) + text);
  };

  const addTag = (tag: string) => {
    tagCount += 1;
    const lower = tag.toLowerCase();

    if (lower.startsWith("<!--")) {
      lines.push(pad.repeat(depth) + tag);
      return;
    }
    if (lower.startsWith("<!")) {
      lines.push(tag);
      return;
    }
    if (lower.startsWith("</")) {
      depth = Math.max(0, depth - 1);
      lines.push(pad.repeat(depth) + tag);
      return;
    }

    lines.push(pad.repeat(depth) + tag);
    const name = tag.slice(1).split(/[\s/>]/u)[0]?.toLowerCase() ?? "";
    const selfClosing = /\/\s*>$/u.test(tag);
    if (!selfClosing && !VOID_TAGS.has(name)) depth += 1;
  };

  for (const match of input.matchAll(TOKEN_PATTERN)) {
    const start = match.index ?? 0;
    addText(input.slice(cursor, start));
    addTag(match[0]);
    cursor = start + match[0].length;
  }
  addText(input.slice(cursor));

  const formatted = lines.join("\n");
  const output = options.escapeMarkup ? escapeMarkupText(formatted) : formatted;

  return {
    output,
    tagCount,
    lineCount: lines.length,
    unclosed: Math.max(0, depth),
  };
}
