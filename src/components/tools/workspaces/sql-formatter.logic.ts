/**
 * Dependency-free SQL formatter.
 *
 * Input is tokenised as text and reassembled with clause breaks and indent.
 * Quoted strings, quoted identifiers, dollar-quoted blocks and comments are
 * opaque: their characters are copied exactly and never uppercased. No query
 * is sent anywhere and no database is contacted.
 */

export const MAX_SQL_CHARS = 300_000;

export type FormatOptions = {
  indent: 2 | 4;
  uppercaseKeywords: boolean;
  singleLineClauses: boolean;
};

export const DEFAULT_FORMAT_OPTIONS: FormatOptions = {
  indent: 2,
  uppercaseKeywords: true,
  singleLineClauses: false,
};

export type FormatErrorCode = "EMPTY" | "TOO_LARGE" | "UNTERMINATED";

export class SqlFormatError extends Error {
  readonly code: FormatErrorCode;

  constructor(code: FormatErrorCode, message: string) {
    super(message);
    this.name = "SqlFormatError";
    this.code = code;
  }
}

export type FormatStats = {
  statements: number;
  lines: number;
};

export type FormatResult = {
  sql: string;
  stats: FormatStats;
};

type TokenKind =
  | "word"
  | "number"
  | "string"
  | "quoted"
  | "operator"
  | "punct"
  | "space"
  | "lineComment"
  | "blockComment";

type Token = { kind: TokenKind; value: string };

type Before = "none" | "space" | "newline" | "newlineBlank";

type Piece = {
  text: string;
  before: Before;
  level: number;
};

const OPERATORS = [
  "<=>", "->>", "::", "||", "->", ">=", "<=", "<>", "!=", "!~", "~*", "=>",
  "=", "<", ">", "+", "-", "*", "/", "%", "&", "|", "^", "~", "!", "?", "@",
].sort((a, b) => b.length - a.length);

const KEYWORDS = new Set<string>([
  "SELECT", "FROM", "WHERE", "GROUP", "BY", "HAVING", "ORDER", "LIMIT",
  "OFFSET", "FETCH", "FIRST", "NEXT", "ONLY", "ROWS", "ROW", "UNION",
  "EXCEPT", "INTERSECT", "ALL", "DISTINCT", "AS", "AND", "OR", "NOT",
  "IN", "IS", "NULL", "LIKE", "ILIKE", "BETWEEN", "EXISTS", "JOIN",
  "LEFT", "RIGHT", "INNER", "OUTER", "FULL", "CROSS", "NATURAL", "ON",
  "USING", "SET", "VALUES", "INSERT", "INTO", "UPDATE", "DELETE",
  "CREATE", "TABLE", "ALTER", "DROP", "TRUNCATE", "PRIMARY", "KEY",
  "FOREIGN", "REFERENCES", "DEFAULT", "CHECK", "UNIQUE", "INDEX", "VIEW",
  "CASE", "WHEN", "THEN", "ELSE", "END", "ASC", "DESC", "NULLS", "LAST",
  "COUNT", "SUM", "AVG", "MIN", "MAX", "COALESCE", "CAST", "WITH",
  "RECURSIVE", "RETURNING", "TRUE", "FALSE", "OVER", "PARTITION",
  "WINDOW", "QUALIFY", "TOP", "PERCENT", "BEGIN", "COMMIT", "ROLLBACK",
  "TRANSACTION", "GRANT", "REVOKE", "IF", "COLLATE", "INTERVAL",
  "EXTRACT", "DATABASE", "SCHEMA", "CONSTRAINT", "COLUMN", "ADD", "RENAME",
  "TO", "FOR", "ANY", "SOME", "ESCAPE", "MATCH", "DEFERRABLE", "CASCADE",
]);

const CLAUSE_WORDS = new Set<string>([
  "SELECT", "FROM", "WHERE", "GROUP", "HAVING", "ORDER", "LIMIT",
  "OFFSET", "FETCH", "UNION", "EXCEPT", "INTERSECT", "JOIN", "LEFT",
  "RIGHT", "INNER", "OUTER", "FULL", "CROSS", "NATURAL", "ON", "USING",
  "SET", "VALUES", "INTO", "RETURNING", "WINDOW", "QUALIFY", "WITH",
  "INSERT", "UPDATE", "DELETE", "CREATE", "ALTER", "DROP", "TRUNCATE",
  "BEGIN", "COMMIT", "ROLLBACK",
]);

const LIST_HEADERS = new Set<string>(["SELECT", "VALUES", "SET"]);

const CASE_WORDS = new Set<string>(["CASE", "WHEN", "THEN", "ELSE", "END"]);

const SPACE_BEFORE_PAREN = new Set<string>([
  "IN", "VALUES", "EXISTS", "AND", "OR", "NOT", "ON", "WHERE", "SELECT",
  "FROM", "BY", "AS", "RETURNING", "WHEN", "THEN", "ELSE", "HAVING",
]);

const isDigit = (character: string): boolean => character >= "0" && character <= "9";

const isWordStart = (character: string): boolean =>
  /[A-Za-z_]/u.test(character) || character.charCodeAt(0) > 127;

const isWordPart = (character: string): boolean =>
  /[A-Za-z0-9_$]/u.test(character) || character.charCodeAt(0) > 127;

function skipDelimited(source: string, start: number, quote: string, doubled: string): number {
  let index = start + 1;
  while (index < source.length) {
    if (source.startsWith(doubled, index)) {
      index += doubled.length;
      continue;
    }
    if (source.charAt(index) === "\\") {
      index += 2;
      continue;
    }
    if (source.charAt(index) === quote) return index + 1;
    index += 1;
  }
  throw new SqlFormatError("UNTERMINATED", "Unterminated quoted text. Close the quote and try again.");
}

function skipBlockComment(source: string, start: number): number {
  const end = source.indexOf("*/", start + 2);
  if (end === -1) {
    throw new SqlFormatError("UNTERMINATED", "Unterminated block comment. Add */ and try again.");
  }
  return end + 2;
}

function skipDollarQuoted(source: string, start: number): number {
  const opening = /^\$([A-Za-z_][A-Za-z0-9_]*)?\$/u.exec(source.slice(start));
  if (!opening) return -1;
  const delimiter = opening[0];
  const close = source.indexOf(delimiter, start + delimiter.length);
  if (close === -1) {
    throw new SqlFormatError("UNTERMINATED", "Unterminated dollar-quoted block. Close the tag and try again.");
  }
  return close + delimiter.length;
}

function skipNumber(source: string, start: number): number {
  let index = start;
  if (source.charAt(index) === "0" && /[xXbBoO]/u.test(source.charAt(index + 1))) {
    index += 2;
    while (index < source.length && /[0-9a-fA-F_]/u.test(source.charAt(index))) index += 1;
    return index;
  }
  while (index < source.length && /[0-9_]/u.test(source.charAt(index))) index += 1;
  if (source.charAt(index) === ".") {
    index += 1;
    while (index < source.length && /[0-9_]/u.test(source.charAt(index))) index += 1;
  }
  if (/[eE]/u.test(source.charAt(index))) {
    let cursor = index + 1;
    if (/[+-]/u.test(source.charAt(cursor))) cursor += 1;
    if (isDigit(source.charAt(cursor))) {
      index = cursor;
      while (index < source.length && /[0-9_]/u.test(source.charAt(index))) index += 1;
    }
  }
  return index;
}

function tokenize(source: string): Token[] {
  const tokens: Token[] = [];
  let index = 0;

  while (index < source.length) {
    const character = source.charAt(index);

    if (/\s/u.test(character)) {
      let end = index + 1;
      while (end < source.length && /\s/u.test(source.charAt(end))) end += 1;
      tokens.push({ kind: "space", value: source.slice(index, end) });
      index = end;
      continue;
    }

    if (character === "-" && source.charAt(index + 1) === "-") {
      let end = index + 2;
      while (end < source.length && !/[\r\n]/u.test(source.charAt(end))) end += 1;
      tokens.push({ kind: "lineComment", value: source.slice(index, end) });
      index = end;
      continue;
    }

    if (character === "#") {
      let end = index + 1;
      while (end < source.length && !/[\r\n]/u.test(source.charAt(end))) end += 1;
      tokens.push({ kind: "lineComment", value: source.slice(index, end) });
      index = end;
      continue;
    }

    if (character === "/" && source.charAt(index + 1) === "*") {
      const end = skipBlockComment(source, index);
      tokens.push({ kind: "blockComment", value: source.slice(index, end) });
      index = end;
      continue;
    }

    if (character === "'") {
      const end = skipDelimited(source, index, "'", "''");
      tokens.push({ kind: "string", value: source.slice(index, end) });
      index = end;
      continue;
    }

    if (character === '"') {
      const end = skipDelimited(source, index, '"', '""');
      tokens.push({ kind: "quoted", value: source.slice(index, end) });
      index = end;
      continue;
    }

    if (character === "`") {
      const end = skipDelimited(source, index, "`", "``");
      tokens.push({ kind: "quoted", value: source.slice(index, end) });
      index = end;
      continue;
    }

    if (character === "[") {
      const close = source.indexOf("]", index + 1);
      if (close === -1) {
        throw new SqlFormatError("UNTERMINATED", "Unterminated bracket name. Add ] and try again.");
      }
      tokens.push({ kind: "quoted", value: source.slice(index, close + 1) });
      index = close + 1;
      continue;
    }

    if (character === "$") {
      const end = skipDollarQuoted(source, index);
      if (end !== -1) {
        tokens.push({ kind: "string", value: source.slice(index, end) });
        index = end;
        continue;
      }
    }

    if (isDigit(character)) {
      const end = skipNumber(source, index);
      tokens.push({ kind: "number", value: source.slice(index, end) });
      index = end;
      continue;
    }

    if (isWordStart(character)) {
      let end = index + 1;
      while (end < source.length && isWordPart(source.charAt(end))) end += 1;
      tokens.push({ kind: "word", value: source.slice(index, end) });
      index = end;
      continue;
    }

    const operator = OPERATORS.find((candidate) => source.startsWith(candidate, index));
    if (operator) {
      tokens.push({ kind: "operator", value: operator });
      index += operator.length;
      continue;
    }

    tokens.push({ kind: "punct", value: character });
    index += 1;
  }

  return tokens;
}

function defaultBefore(token: Token, previous: Token | null): Before {
  if (!previous) return "none";
  if (token.kind === "lineComment") return "newline";
  if (token.kind === "blockComment") return "space";
  if (token.kind === "operator") return "space";
  if (token.value === "(") {
    if (previous.kind === "word" && SPACE_BEFORE_PAREN.has(previous.value.toUpperCase())) return "space";
    return previous.kind === "operator" ? "space" : "none";
  }
  if (token.value === ")" || token.value === "," || token.value === ";" || token.value === ".") {
    return "none";
  }
  if (token.kind === "word" || token.kind === "number" || token.kind === "string" || token.kind === "quoted") {
    if (previous.kind === "word" || previous.kind === "number" || previous.kind === "string" || previous.kind === "quoted") {
      return "space";
    }
    if (previous.value === ")" || previous.kind === "operator") return "space";
  }
  return "none";
}

function assemble(pieces: Piece[], indent: number): string {
  const lines: string[] = [];
  let current = "";

  for (const piece of pieces) {
    if (piece.before === "newlineBlank") {
      if (current.trim()) lines.push(current.trimEnd());
      current = "";
      if (lines[lines.length - 1] !== "") lines.push("");
    } else if (piece.before === "newline") {
      if (current.trim()) lines.push(current.trimEnd());
      current = " ".repeat(indent * piece.level);
    } else if (piece.before === "space") {
      if (current.trim() !== "") current += " ";
    }
    current += piece.text;
  }

  if (current.trim()) lines.push(current.trimEnd());
  while (lines.length > 0 && lines[lines.length - 1] === "") lines.pop();
  return lines.join("\n");
}

const SIMPLE_CLAUSE_MAX_TOKENS = 12;

function isClauseWord(token: Token): boolean {
  return token.kind === "word" && CLAUSE_WORDS.has(token.value.toUpperCase());
}

/**
 * A clause is "simple" when it has no top-level list, boolean branch, CASE
 * block or comment and stays inside a small token budget. Such clauses can be
 * folded onto the previous line by the singleLineClauses option.
 */
function isShortSimpleClause(tokens: Token[], start: number): boolean {
  let depth = 0;
  let count = 0;

  for (let index = start; index < tokens.length; index += 1) {
    const token = tokens[index];
    if (token.kind === "lineComment" || token.kind === "blockComment") return false;

    const atTopLevel = depth === 0;
    if (token.value === "(") depth += 1;
    if (token.value === ")") depth = Math.max(0, depth - 1);

    if (atTopLevel && index > start && (token.value === ";" || isClauseWord(token))) break;
    if (atTopLevel && token.value === ",") return false;

    if (token.kind === "word") {
      const upper = token.value.toUpperCase();
      if (CASE_WORDS.has(upper) || upper === "AND" || upper === "OR") return false;
    }

    count += 1;
    if (count > SIMPLE_CLAUSE_MAX_TOKENS) return false;
  }

  return true;
}

function formatTokens(tokens: Token[], options: FormatOptions): string {
  const pieces: Piece[] = [];
  let previous: Token | null = null;
  let override: { before: Before; level: number } | null = null;
  let indentLevel = 0;
  let depth = 0;
  let previousClauseSimple = false;

  const push = (text: string, before: Before, level = 0) => {
    pieces.push({ text, before, level });
  };

  for (let index = 0; index < tokens.length; index += 1) {
    const token = tokens[index];
    const upper = token.kind === "word" ? token.value.toUpperCase() : "";
    const keyword = KEYWORDS.has(upper);
    const display = keyword && options.uppercaseKeywords ? upper : token.value;
    const chosen = override ?? { before: defaultBefore(token, previous), level: indentLevel };
    override = null;

    if (token.kind === "lineComment") {
      push(token.value, chosen.before, indentLevel);
      override = { before: "newline", level: indentLevel };
      previousClauseSimple = false;
      previous = token;
      continue;
    }

    if (token.kind === "blockComment") {
      push(token.value, chosen.before, indentLevel);
      override = { before: "space", level: indentLevel };
      previousClauseSimple = false;
      previous = token;
      continue;
    }

    if ((upper === "GROUP" || upper === "ORDER") && tokens[index + 1]?.value.toUpperCase() === "BY") {
      const by = tokens[index + 1];
      const byDisplay = options.uppercaseKeywords ? "BY" : by.value;
      const simple = isShortSimpleClause(tokens, index);
      const inline = options.singleLineClauses && previousClauseSimple && simple;
      push(`${display} ${byDisplay}`, inline && index > 0 ? "space" : "newline", 0);
      if (!inline) indentLevel = 1;
      previousClauseSimple = simple;
      previous = by;
      index += 1;
      continue;
    }

    if (CLAUSE_WORDS.has(upper)) {
      const simple = isShortSimpleClause(tokens, index);
      const inline = options.singleLineClauses && previousClauseSimple && simple;
      push(display, inline && index > 0 ? "space" : "newline", 0);
      if (!inline) {
        indentLevel = 1;
        if (LIST_HEADERS.has(upper) && !(options.singleLineClauses && simple)) {
          override = { before: "newline", level: 1 };
        }
      }
      previousClauseSimple = simple;
      previous = token;
      continue;
    }

    if (upper === "AND" || upper === "OR" || CASE_WORDS.has(upper)) {
      push(display, "newline", 1);
      previous = token;
      continue;
    }

    if (token.value === "(") {
      push("(", chosen.before, indentLevel);
      depth += 1;
      previous = token;
      continue;
    }

    if (token.value === ")") {
      depth = Math.max(0, depth - 1);
      push(")", "none", indentLevel);
      previous = token;
      continue;
    }

    if (token.value === ",") {
      push(",", "none", indentLevel);
      override = depth === 0 ? { before: "newline", level: 1 } : { before: "space", level: indentLevel };
      previous = token;
      continue;
    }

    if (token.value === ";") {
      push(";", "none", indentLevel);
      override = { before: "newlineBlank", level: 0 };
      indentLevel = 0;
      previousClauseSimple = false;
      previous = token;
      continue;
    }

    if (token.value === ".") {
      push(".", "none", indentLevel);
      previous = token;
      continue;
    }

    push(display, chosen.before, indentLevel);
    previous = token;
  }

  return assemble(pieces, options.indent);
}

export function formatSql(source: string, options: FormatOptions = DEFAULT_FORMAT_OPTIONS): FormatResult {
  if (!source.trim()) {
    throw new SqlFormatError("EMPTY", "Paste a query into the SQL box to format it.");
  }
  if (source.length > MAX_SQL_CHARS) {
    throw new SqlFormatError("TOO_LARGE", "Query is over 300,000 characters. Shorten it and try again.");
  }

  const significant = tokenize(source).filter((token) => token.kind !== "space");
  const sql = formatTokens(significant, options);
  const ending = significant[significant.length - 1];
  const separators = significant.filter((token) => token.value === ";").length;
  const statements = separators + (ending && ending.value !== ";" ? 1 : 0);

  return {
    sql,
    stats: { statements, lines: sql.split("\n").length },
  };
}
