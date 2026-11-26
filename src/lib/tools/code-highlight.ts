/**
 * Pure, dependency-free syntax tokeniser for the read-only code outputs.
 * It produces React-safe token objects, never HTML strings.
 */

export type CodeLanguage =
  | "json"
  | "html"
  | "css"
  | "js"
  | "sql"
  | "csv"
  | "yaml"
  | "text";

export type CodeTokenType =
  | "plain"
  | "keyword"
  | "string"
  | "number"
  | "comment"
  | "punctuation"
  | "tag"
  | "property"
  | "boolean";

export interface CodeToken {
  text: string;
  type: CodeTokenType;
}

export interface CodeLine {
  tokens: CodeToken[];
}

const KEYWORDS: Record<CodeLanguage, readonly string[]> = {
  json: [],
  html: [],
  css: ["media", "import", "supports", "keyframes", "important"],
  js: [
    "const", "let", "var", "function", "return", "if", "else", "for", "while",
    "class", "new", "this", "import", "from", "export", "default", "async",
    "await", "try", "catch", "throw", "typeof", "instanceof", "delete", "in",
    "of", "do", "switch", "case", "break", "continue", "yield",
  ],
  sql: [
    "SELECT", "FROM", "WHERE", "INSERT", "INTO", "VALUES", "UPDATE", "SET",
    "DELETE", "CREATE", "TABLE", "ALTER", "DROP", "JOIN", "LEFT", "RIGHT",
    "INNER", "OUTER", "ON", "AND", "OR", "NOT", "NULL", "IS", "IN", "LIKE",
    "BETWEEN", "ORDER", "BY", "GROUP", "HAVING", "LIMIT", "OFFSET", "AS",
    "DISTINCT", "CASE", "WHEN", "THEN", "ELSE", "END", "ASC", "DESC", "WITH",
  ],
  csv: [],
  yaml: ["true", "false", "null", "yes", "no"],
  text: [],
};

const BOOLEANS = new Set(["true", "false", "null", "undefined"]);

function commentPattern(language: CodeLanguage): RegExp | null {
  switch (language) {
    case "sql":
      return /^(--[^\n]*|\/\*[\s\S]*?\*\/)/u;
    case "yaml":
      return /^(#[^\n]*)/u;
    case "css":
      return /^(\/\*[\s\S]*?\*\/)/u;
    case "js":
      return /^(\/\/[^\n]*|\/\*[\s\S]*?\*\/)/u;
    case "html":
      return /^(<!--[\s\S]*?-->)/u;
    default:
      return null;
  }
}

function isWord(char: string): boolean {
  return /[\p{L}\p{N}_$]/u.test(char);
}

function pushToken(tokens: CodeToken[], text: string, type: CodeTokenType) {
  if (!text) return;
  const last = tokens[tokens.length - 1];
  if (last && last.type === type) last.text += text;
  else tokens.push({ text, type });
}

/** Tokenise one line without touching the DOM. */
export function tokenizeLine(line: string, language: CodeLanguage): CodeToken[] {
  const tokens: CodeToken[] = [];
  const comment = commentPattern(language);
  const keywords = new Set(KEYWORDS[language]);
  let rest = line;

  while (rest.length > 0) {
    if (comment) {
      const match = comment.exec(rest);
      if (match) {
        pushToken(tokens, match[1], "comment");
        rest = rest.slice(match[0].length);
        continue;
      }
    }

    const char = rest[0];

    if (char === '"' || char === "'" || char === "`") {
      let index = 1;
      while (index < rest.length) {
        if (rest[index] === "\\") index += 2;
        else if (rest[index] === char) { index += 1; break; }
        else index += 1;
      }
      pushToken(tokens, rest.slice(0, index), "string");
      rest = rest.slice(index);
      continue;
    }

    if (/\d/u.test(char)) {
      let index = 1;
      while (index < rest.length && /[\d._a-fA-FxX]/u.test(rest[index])) index += 1;
      pushToken(tokens, rest.slice(0, index), "number");
      rest = rest.slice(index);
      continue;
    }

    if (isWord(char)) {
      let index = 1;
      while (index < rest.length && isWord(rest[index])) index += 1;
      const word = rest.slice(0, index);
      const isProperty =
        language === "json" || language === "yaml"
          ? /^\s*:/u.test(rest.slice(index))
          : false;
      const type: CodeTokenType = isProperty
        ? "property"
        : BOOLEANS.has(word.toLowerCase())
          ? "boolean"
          : keywords.has(word) || keywords.has(word.toUpperCase())
            ? "keyword"
            : "plain";
      pushToken(tokens, word, type);
      rest = rest.slice(index);
      continue;
    }

    if (language === "html" && char === "<") {
      const match = /^<\/?[\w-]+/u.exec(rest);
      if (match) {
        pushToken(tokens, match[0], "tag");
        rest = rest.slice(match[0].length);
        continue;
      }
    }

    if (/[{}()[\];,.:=<>/+*%-]/u.test(char)) {
      pushToken(tokens, char, "punctuation");
      rest = rest.slice(1);
      continue;
    }

    pushToken(tokens, char, "plain");
    rest = rest.slice(1);
  }

  return tokens;
}

/** Split code into lines with tokens for the shared code-output component. */
export function tokenizeCode(code: string, language: CodeLanguage): CodeLine[] {
  return code.split(/\r?\n/u).map((line) => ({ tokens: tokenizeLine(line, language) }));
}
