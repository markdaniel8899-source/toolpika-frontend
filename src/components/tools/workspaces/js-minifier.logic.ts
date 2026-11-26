/**
 * Dependency-free JavaScript minifier.
 *
 * The source is treated as text only. It is tokenised with a small lexer and
 * the tokens are joined back together; nothing is ever evaluated or executed.
 * Strings, template literals and regular expressions are opaque, so text that
 * looks like a comment inside them is never touched.
 */

export const MAX_JS_CHARS = 500_000;

export type MinifyOptions = {
  stripComments: boolean;
  preserveSemicolons: boolean;
  collapseBooleans: boolean;
  removeDebugger: boolean;
};

export const DEFAULT_MINIFY_OPTIONS: MinifyOptions = {
  stripComments: true,
  preserveSemicolons: false,
  collapseBooleans: true,
  removeDebugger: true,
};

export type MinifyErrorCode = "EMPTY" | "TOO_LARGE" | "UNTERMINATED";

export class MinifyError extends Error {
  readonly code: MinifyErrorCode;

  constructor(code: MinifyErrorCode, message: string) {
    super(message);
    this.name = "MinifyError";
    this.code = code;
  }
}

export type MinifyStats = {
  originalBytes: number;
  minifiedBytes: number;
  savedPercent: number;
};

export type MinifyResult = {
  code: string;
  stats: MinifyStats;
};

type TokenKind =
  | "word"
  | "number"
  | "string"
  | "template"
  | "regex"
  | "punct"
  | "space"
  | "lineComment"
  | "blockComment";

type Token = {
  kind: TokenKind;
  value: string;
  breaksLine: boolean;
};

type Event = {
  token: Token;
  spaceBefore: string;
};

const OPERATORS = [
  ">>>=", "===", "!==", "**=", "<<=", ">>=", "&&=", "||=", "??=",
  ">>>", "...", "=>", "==", "!=", "<=", ">=", "&&", "||", "??", "?.",
  "++", "--", "+=", "-=", "*=", "/=", "%=", "&=", "|=", "^=", "<<",
  ">>", "**", "(", ")", "[", "]", "{", "}", ",", ";", ".", "=", "<",
  ">", "+", "-", "*", "/", "%", "&", "|", "^", "!", "~", "?", ":",
  "#", "@",
].sort((a, b) => b.length - a.length);

const REGEX_KEYWORDS = new Set<string>([
  "return", "throw", "case", "delete", "typeof", "void", "new", "in",
  "of", "instanceof", "yield", "await", "else", "do",
]);

const REGEX_BLOCKED_PUNCT = new Set<string>(["}", ")", "]", "++", "--"]);

const BREAK_KEYWORDS = new Set<string>(["return", "throw", "break", "continue", "++", "--"]);

const LINEBREAK_STATEMENT_STARTS = new Set<string>(["(", "[", "`", "+", "-", "/"]);

const isDigit = (character: string): boolean => character >= "0" && character <= "9";

const isIdStart = (character: string): boolean =>
  /[A-Za-z_$]/u.test(character) || character.charCodeAt(0) > 127;

const isIdPart = (character: string): boolean =>
  /[A-Za-z0-9_$]/u.test(character) || character.charCodeAt(0) > 127;

/** UTF-8 byte length, including surrogate pairs. No Web API required. */
function utf8Bytes(text: string): number {
  let bytes = 0;
  for (let index = 0; index < text.length; index += 1) {
    const code = text.charCodeAt(index);
    if (code < 0x80) {
      bytes += 1;
    } else if (code < 0x800) {
      bytes += 2;
    } else if (code >= 0xd800 && code <= 0xdbff && index + 1 < text.length) {
      const low = text.charCodeAt(index + 1);
      if (low >= 0xdc00 && low <= 0xdfff) {
        bytes += 4;
        index += 1;
      } else {
        bytes += 3;
      }
    } else {
      bytes += 3;
    }
  }
  return bytes;
}

function skipQuoted(source: string, start: number, quote: string): number {
  let index = start + 1;
  while (index < source.length) {
    const character = source.charAt(index);
    if (character === "\\") {
      index += 2;
      continue;
    }
    if (character === quote) return index + 1;
    index += 1;
  }
  throw new MinifyError("UNTERMINATED", "Unterminated string. Close the quote and try again.");
}

function skipBlockComment(source: string, start: number): number {
  const end = source.indexOf("*/", start + 2);
  if (end === -1) {
    throw new MinifyError("UNTERMINATED", "Unterminated block comment. Add */ and try again.");
  }
  return end + 2;
}

/**
 * Returns the index just after a template literal. Interpolations are skipped,
 * including nested strings, comments and nested templates.
 */
function skipTemplate(source: string, start: number): number {
  let index = start + 1;
  while (index < source.length) {
    const character = source.charAt(index);
    if (character === "\\") {
      index += 2;
      continue;
    }
    if (character === "`") return index + 1;
    if (character === "$" && source.charAt(index + 1) === "{") {
      index = skipInterpolation(source, index + 2);
      continue;
    }
    index += 1;
  }
  throw new MinifyError("UNTERMINATED", "Unterminated template literal. Close the backtick.");
}

function skipInterpolation(source: string, start: number): number {
  let depth = 1;
  let index = start;
  while (index < source.length) {
    const character = source.charAt(index);
    if (character === "'" || character === '"') {
      index = skipQuoted(source, index, character);
      continue;
    }
    if (character === "`") {
      index = skipTemplate(source, index);
      continue;
    }
    if (character === "/" && source.charAt(index + 1) === "/") {
      while (index < source.length && !/[\r\n]/u.test(source.charAt(index))) index += 1;
      continue;
    }
    if (character === "/" && source.charAt(index + 1) === "*") {
      index = skipBlockComment(source, index);
      continue;
    }
    if (character === "{") {
      depth += 1;
    } else if (character === "}") {
      depth -= 1;
      if (depth === 0) return index + 1;
    }
    index += 1;
  }
  throw new MinifyError("UNTERMINATED", "Unterminated template expression. Close the brace.");
}

function skipRegex(source: string, start: number): number {
  let index = start + 1;
  let inClass = false;
  while (index < source.length) {
    const character = source.charAt(index);
    if (character === "\\") {
      index += 2;
      continue;
    }
    if (character === "\r" || character === "\n") break;
    if (inClass) {
      if (character === "]") inClass = false;
    } else if (character === "[") {
      inClass = true;
    } else if (character === "/") {
      index += 1;
      while (index < source.length && isIdPart(source.charAt(index))) index += 1;
      return index;
    }
    index += 1;
  }
  throw new MinifyError("UNTERMINATED", "Unterminated regular expression. Close the slash.");
}

function skipNumber(source: string, start: number): number {
  let index = start;
  const radical = source.charAt(index + 1);
  if (source.charAt(index) === "0" && /[xXbBoO]/u.test(radical)) {
    index += 2;
    while (index < source.length && /[0-9a-fA-F_]/u.test(source.charAt(index))) index += 1;
    if (source.charAt(index) === "n") index += 1;
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
  if (source.charAt(index) === "n") index += 1;
  return index;
}

function canStartRegex(previous: Token | null): boolean {
  if (!previous) return true;
  if (previous.kind === "word") return REGEX_KEYWORDS.has(previous.value);
  if (previous.kind === "punct") return !REGEX_BLOCKED_PUNCT.has(previous.value);
  return false;
}

function tokenize(source: string): Token[] {
  const tokens: Token[] = [];
  const state: { previous: Token | null } = { previous: null };
  let index = 0;

  const push = (kind: TokenKind, value: string) => {
    const token: Token = {
      kind,
      value,
      breaksLine: /[\r\n]/u.test(value),
    };
    tokens.push(token);
    if (kind !== "space" && kind !== "lineComment" && kind !== "blockComment") {
      state.previous = token;
    }
  };

  while (index < source.length) {
    const character = source.charAt(index);

    if (/\s/u.test(character)) {
      let end = index + 1;
      while (end < source.length && /\s/u.test(source.charAt(end))) end += 1;
      push("space", source.slice(index, end));
      index = end;
      continue;
    }

    if (character === "/" && source.charAt(index + 1) === "/") {
      let end = index + 2;
      while (end < source.length && !/[\r\n]/u.test(source.charAt(end))) end += 1;
      push("lineComment", source.slice(index, end));
      index = end;
      continue;
    }

    if (character === "/" && source.charAt(index + 1) === "*") {
      const end = skipBlockComment(source, index);
      push("blockComment", source.slice(index, end));
      index = end;
      continue;
    }

    if (character === "'" || character === '"') {
      const end = skipQuoted(source, index, character);
      push("string", source.slice(index, end));
      index = end;
      continue;
    }

    if (character === "`") {
      const end = skipTemplate(source, index);
      push("template", source.slice(index, end));
      index = end;
      continue;
    }

    if (character === "/" && canStartRegex(state.previous)) {
      const end = skipRegex(source, index);
      push("regex", source.slice(index, end));
      index = end;
      continue;
    }

    if (isDigit(character) || (character === "." && isDigit(source.charAt(index + 1)))) {
      const end = skipNumber(source, index);
      push("number", source.slice(index, end));
      index = end;
      continue;
    }

    if (isIdStart(character)) {
      let end = index + 1;
      while (end < source.length && isIdPart(source.charAt(end))) end += 1;
      push("word", source.slice(index, end));
      index = end;
      continue;
    }

    const operator = OPERATORS.find((candidate) => source.startsWith(candidate, index));
    const value = operator ?? character;
    push("punct", value);
    index += value.length;
  }

  return tokens;
}

function needsSpace(previous: Token, current: Token): boolean {
  const previousEnd = previous.value.charAt(previous.value.length - 1);
  const currentStart = current.value.charAt(0);

  if (isIdPart(previousEnd) && isIdPart(currentStart)) return true;
  if ((previousEnd === "+" || previousEnd === "-") && (currentStart === "+" || currentStart === "-")) return true;
  if (previousEnd === "/" && (currentStart === "/" || currentStart === "*")) return true;
  if (isDigit(previousEnd) && currentStart === ".") return true;
  if (previousEnd === "." && isDigit(currentStart)) return true;
  return false;
}

function canDropSemicolon(previous: Token | null, next: Token | null): boolean {
  if (!next) return true;
  if (next.value === "}") return true;
  if (next.value === ";") return true;
  if (!previous) return true;
  return previous.value === "{" || previous.value === ";";
}

function needsInsertedSemicolon(previous: Token, current: Token): boolean {
  if (BREAK_KEYWORDS.has(previous.value)) return true;
  return previous.value === "}" && LINEBREAK_STATEMENT_STARTS.has(current.value.charAt(0));
}

/**
 * Drop `debugger;` statements from the event stream. Only a standalone
 * statement is removed: a property name (`obj.debugger`) or a key
 * (`{debugger: 1}`) is left alone. Any line break that belonged to a removed
 * statement is carried to the next event so automatic semicolon insertion
 * still behaves the same way.
 */
function stripDebuggerEvents(events: Event[]): Event[] {
  const result: Event[] = [];
  let carriedBreak = "";

  for (let index = 0; index < events.length; index += 1) {
    const event = events[index];
    const previous = result[result.length - 1]?.token ?? null;
    const next = events[index + 1]?.token ?? null;
    const isStatement =
      event.token.kind === "word" &&
      event.token.value === "debugger" &&
      previous?.value !== "." &&
      previous?.value !== "?." &&
      next?.value !== "." &&
      next?.value !== "?." &&
      next?.value !== ":";

    if (isStatement) {
      if (/[\r\n]/u.test(event.spaceBefore)) carriedBreak += "\n";
      if (next?.value === ";") {
        index += 1;
        if (/[\r\n]/u.test(events[index].spaceBefore)) carriedBreak += "\n";
      }
      continue;
    }

    result.push(carriedBreak ? { ...event, spaceBefore: carriedBreak + event.spaceBefore } : event);
    carriedBreak = "";
  }

  return result;
}

/** True when a `true`/`false` token is a key, not a value literal. */
function isBooleanKey(previous: Token | null, next: Token | null): boolean {
  const previousValue = previous?.value;
  const nextValue = next?.value;
  return (
    previousValue === "." ||
    previousValue === "?." ||
    previousValue === "get" ||
    previousValue === "set" ||
    nextValue === ":" ||
    nextValue === "." ||
    nextValue === "?." ||
    (previousValue === "{" &&
      (nextValue === "}" || nextValue === "," || nextValue === "("))
  );
}

function render(tokens: Token[], options: MinifyOptions): string {
  let events: Event[] = [];
  let space = "";

  for (const token of tokens) {
    if (token.kind === "space") {
      space += token.value;
      continue;
    }
    const isComment = token.kind === "lineComment" || token.kind === "blockComment";
    if (isComment && options.stripComments) {
      if (token.breaksLine) space += "\n";
      continue;
    }
    events.push({ token, spaceBefore: space });
    space = "";
  }

  if (options.removeDebugger) {
    events = stripDebuggerEvents(events);
  }

  let output = "";
  let previous: Token | null = null;

  for (let index = 0; index < events.length; index += 1) {
    const { spaceBefore } = events[index];
    let { token } = events[index];
    const next = events[index + 1]?.token ?? null;

    if (token.kind === "lineComment" || token.kind === "blockComment") {
      output += `${output ? " " : ""}${token.value}`;
      if (token.kind === "lineComment") output += "\n";
      continue;
    }

    // `!0` / `!1` are exactly as truthy as `true` / `false`. Only literal
    // tokens in value position are folded; keys and member names stay put.
    if (
      options.collapseBooleans &&
      token.kind === "word" &&
      (token.value === "true" || token.value === "false") &&
      !isBooleanKey(previous, next)
    ) {
      token = {
        ...token,
        kind: "punct",
        value: token.value === "true" ? "!0" : "!1",
      };
    }

    if (token.value === ";" && !options.preserveSemicolons && canDropSemicolon(previous, next)) {
      continue;
    }

    let separator = "";
    if (previous) {
      if (/\r|\n/u.test(spaceBefore) && needsInsertedSemicolon(previous, token)) {
        separator = ";";
      } else if (needsSpace(previous, token)) {
        separator = " ";
      }
    }

    output += separator + token.value;
    previous = token;
  }

  return output;
}

export function minifyJavaScript(
  source: string,
  options: MinifyOptions = DEFAULT_MINIFY_OPTIONS,
): MinifyResult {
  if (!source.trim()) {
    throw new MinifyError("EMPTY", "Paste some JavaScript into the source box to minify it.");
  }
  if (source.length > MAX_JS_CHARS) {
    throw new MinifyError("TOO_LARGE", "Source is over 500,000 characters. Shorten the file and try again.");
  }

  const code = render(tokenize(source), options);
  const originalBytes = utf8Bytes(source);
  const minifiedBytes = utf8Bytes(code);
  const savedPercent =
    originalBytes === 0
      ? 0
      : Math.max(0, Math.min(100, Math.round(((originalBytes - minifiedBytes) / originalBytes) * 100)));

  return {
    code,
    stats: { originalBytes, minifiedBytes, savedPercent },
  };
}
