/**
 * Pure CSS formatter. No DOM, no React, no eval.
 *
 * The stylesheet is read as nested blocks and declarations. Quoted strings,
 * comments and parenthesised values (for example data URLs) are protected, so
 * a semicolon or brace inside them never changes the structure of the tree.
 */

export type IndentChoice = "2" | "4";

export type CssFormatterOptions = {
  indent: IndentChoice;
  propertyPerLine: boolean;
};

export const DEFAULT_CSS_FORMATTER_OPTIONS: CssFormatterOptions = {
  indent: "2",
  propertyPerLine: true,
};

export const CSS_FORMATTER_CHAR_LIMIT = 200_000;

export type CssFormatterErrorCode = "TOO_LARGE" | "UNBALANCED";

/** Typed, translatable error: the UI decides what wording to show. */
export class CssFormatterError extends Error {
  readonly code: CssFormatterErrorCode;

  constructor(code: CssFormatterErrorCode) {
    super(code);
    this.name = "CssFormatterError";
    this.code = code;
  }
}

export type CssFormatterStats = {
  rules: number;
  properties: number;
};

export type CssFormatterResult = {
  css: string;
  stats: CssFormatterStats;
};

type CssNode =
  | { kind: "comment"; raw: string }
  | { kind: "declaration"; raw: string }
  | { kind: "rule"; selector: string; children: CssNode[] };

type Cursor = { index: number };

function readString(source: string, cursor: Cursor): string {
  const quote = source[cursor.index];
  const start = cursor.index;
  cursor.index += 1;
  while (cursor.index < source.length) {
    if (source[cursor.index] === "\\") {
      cursor.index += 2;
      continue;
    }
    const done = source[cursor.index] === quote;
    cursor.index += 1;
    if (done) break;
  }
  return source.slice(start, cursor.index);
}

function readComment(source: string, cursor: Cursor): string {
  const start = cursor.index;
  const end = source.indexOf("*/", cursor.index + 2);
  cursor.index = end === -1 ? source.length : end + 2;
  return source.slice(start, cursor.index);
}

/** Collapse insignificant whitespace while copying strings and comments. */
function normalizeSpace(text: string): string {
  let out = "";
  let pending = false;
  let index = 0;

  while (index < text.length) {
    const ch = text[index];
    if (/\s/u.test(ch)) {
      pending = true;
      index += 1;
      continue;
    }
    if (ch === "/" && text[index + 1] === "*") {
      const start = index;
      const end = text.indexOf("*/", index + 2);
      index = end === -1 ? text.length : end + 2;
      if (pending && out) out += " ";
      pending = false;
      out += text.slice(start, index);
      continue;
    }
    if (ch === '"' || ch === "'") {
      const start = index;
      index += 1;
      while (index < text.length) {
        if (text[index] === "\\") {
          index += 2;
          continue;
        }
        const done = text[index] === ch;
        index += 1;
        if (done) break;
      }
      if (pending && out) out += " ";
      pending = false;
      out += text.slice(start, index);
      continue;
    }
    if (pending && out) out += " ";
    pending = false;
    out += ch;
    index += 1;
  }

  return out.trim();
}

/** First colon outside strings, comments and parentheses, or -1. */
function findTopLevelColon(text: string): number {
  let depth = 0;
  let quote: string | null = null;

  for (let index = 0; index < text.length; index += 1) {
    const ch = text[index];
    if (quote) {
      if (ch === "\\") {
        index += 1;
        continue;
      }
      if (ch === quote) quote = null;
      continue;
    }
    if (ch === "/" && text[index + 1] === "*") {
      const end = text.indexOf("*/", index + 2);
      index = end === -1 ? text.length : end + 1;
      continue;
    }
    if (ch === '"' || ch === "'") {
      quote = ch;
      continue;
    }
    if (ch === "(") {
      depth += 1;
      continue;
    }
    if (ch === ")") {
      depth = Math.max(0, depth - 1);
      continue;
    }
    if (ch === ":" && depth === 0) return index;
  }

  return -1;
}

/** Parse a flat slice of CSS into nodes; a nested call ends at its own brace. */
function parseNodes(source: string, cursor: Cursor, inBlock: boolean): CssNode[] {
  const nodes: CssNode[] = [];
  let buffer = "";
  let depth = 0;

  while (cursor.index < source.length) {
    const ch = source[cursor.index];

    if (depth === 0 && ch === "}") {
      if (inBlock) {
        if (buffer.trim()) {
          nodes.push({ kind: "declaration", raw: normalizeSpace(buffer) });
        }
        buffer = "";
        cursor.index += 1;
        return nodes;
      }
      throw new CssFormatterError("UNBALANCED");
    }

    if (depth === 0 && ch === "/" && source[cursor.index + 1] === "*") {
      const raw = readComment(source, cursor);
      if (!buffer.trim()) nodes.push({ kind: "comment", raw });
      else buffer += ` ${raw} `;
      continue;
    }

    if (ch === '"' || ch === "'") {
      buffer += readString(source, cursor);
      continue;
    }

    if (ch === "(") {
      depth += 1;
      buffer += ch;
      cursor.index += 1;
      continue;
    }
    if (ch === ")") {
      depth = Math.max(0, depth - 1);
      buffer += ch;
      cursor.index += 1;
      continue;
    }

    if (depth === 0 && ch === "{") {
      const selector = normalizeSpace(buffer);
      buffer = "";
      cursor.index += 1;
      nodes.push({ kind: "rule", selector, children: parseNodes(source, cursor, true) });
      continue;
    }

    if (depth === 0 && ch === ";") {
      const raw = normalizeSpace(buffer);
      buffer = "";
      cursor.index += 1;
      if (raw) nodes.push({ kind: "declaration", raw: `${raw};` });
      continue;
    }

    buffer += ch;
    cursor.index += 1;
  }

  if (inBlock) throw new CssFormatterError("UNBALANCED");
  if (buffer.trim()) nodes.push({ kind: "declaration", raw: normalizeSpace(buffer) });
  return nodes;
}

/** Add a space after colons in at-rule preludes, respecting strings/comments. */
function formatAtRuleHeader(raw: string): string {
  let out = "";
  let index = 0;
  let quote: string | null = null;

  while (index < raw.length) {
    const ch = raw[index];
    if (quote) {
      out += ch;
      if (ch === "\\" && index + 1 < raw.length) {
        index += 1;
        out += raw[index];
      } else if (ch === quote) {
        quote = null;
      }
      index += 1;
      continue;
    }
    if (ch === "/" && raw[index + 1] === "*") {
      const start = index;
      const end = raw.indexOf("*/", index + 2);
      index = end === -1 ? raw.length : end + 2;
      out += raw.slice(start, index);
      continue;
    }
    if (ch === '"' || ch === "'") {
      quote = ch;
      out += ch;
      index += 1;
      continue;
    }
    if (ch === ":") {
      out += ":";
      index += 1;
      if (index < raw.length && !/\s/u.test(raw[index])) out += " ";
      continue;
    }
    out += ch;
    index += 1;
  }

  return out;
}

function formatDeclaration(raw: string): string {
  const body = raw.endsWith(";") ? raw.slice(0, -1) : raw;
  const colon = findTopLevelColon(body);
  if (colon === -1) return `${body.trim()};`;
  const property = body.slice(0, colon).trim();
  const value = body.slice(colon + 1).trim();
  return value ? `${property}: ${value};` : `${property};`;
}

function renderNodes(
  nodes: CssNode[],
  level: number,
  unit: string,
  propertyPerLine: boolean,
): string[] {
  const pad = (depth: number) => unit.repeat(depth);
  const lines: string[] = [];
  let pending: string[] = [];

  const flush = () => {
    if (pending.length === 0) return;
    if (propertyPerLine) {
      for (const declaration of pending) lines.push(`${pad(level)}${declaration}`);
    } else {
      lines.push(`${pad(level)}${pending.join(" ")}`);
    }
    pending = [];
  };

  for (const node of nodes) {
    if (node.kind === "declaration") {
      pending.push(formatDeclaration(node.raw));
      continue;
    }
    flush();
    if (node.kind === "comment") {
      lines.push(`${pad(level)}${node.raw}`);
      continue;
    }
    const header = node.selector.startsWith("@")
      ? formatAtRuleHeader(node.selector)
      : node.selector;
    lines.push(`${pad(level)}${header} {`);
    lines.push(...renderNodes(node.children, level + 1, unit, propertyPerLine));
    lines.push(`${pad(level)}}`);
  }

  flush();
  return lines;
}

function countNodes(nodes: CssNode[], stats: CssFormatterStats): void {
  for (const node of nodes) {
    if (node.kind === "rule") {
      stats.rules += 1;
      countNodes(node.children, stats);
    } else if (node.kind === "declaration" && findTopLevelColon(node.raw) !== -1) {
      stats.properties += 1;
    }
  }
}

/** Format CSS text and return the output together with rule and property counts. */
export function formatCss(input: string, options: CssFormatterOptions): CssFormatterResult {
  const source = input.replace(/\r\n?/gu, "\n");
  if (source.length > CSS_FORMATTER_CHAR_LIMIT) {
    throw new CssFormatterError("TOO_LARGE");
  }

  const stats: CssFormatterStats = { rules: 0, properties: 0 };
  if (!source.trim()) return { css: "", stats };

  const nodes = parseNodes(source, { index: 0 }, false);
  countNodes(nodes, stats);
  const css = renderNodes(nodes, 0, " ".repeat(Number(options.indent)), options.propertyPerLine).join("\n");
  return { css, stats };
}
