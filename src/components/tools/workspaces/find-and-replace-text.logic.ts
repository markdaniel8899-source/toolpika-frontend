/**
 * Pure find-and-replace engine. No DOM, React or network access.
 * Patterns compile with the browser's JavaScript RegExp rules via `new RegExp`,
 * but user input is never evaluated as code.
 */

export type ReplaceOptions = {
  caseSensitive: boolean;
  wholeWord: boolean;
  regexMode: boolean;
};

export const DEFAULT_REPLACE_OPTIONS: ReplaceOptions = {
  caseSensitive: false,
  wholeWord: false,
  regexMode: false,
};

export type ReplaceErrorCode = "EMPTY_FIND" | "INVALID_REGEX" | "TOO_LARGE";

export interface ReplaceHit {
  index: number;
  value: string;
}

export interface ReplaceSegment {
  text: string;
  replaced: boolean;
}

export interface ReplaceResult {
  output: string;
  hits: ReplaceHit[];
  segments: ReplaceSegment[];
  truncated: boolean;
  error?: { code: ReplaceErrorCode };
}

/** Keeps a single edit responsive even on pasted documents. */
export const MAX_INPUT_LENGTH = 200_000;
/** Above this many hits, later matches are left untouched. */
export const MAX_MATCHES = 2_000;

const LITERAL_SPECIALS = /[.*+?^${}()|[\]\\]/gu;
const WORD_BOUNDARY = "[\\p{L}\\p{N}_]";

/** Escape a literal search string so regex metacharacters match themselves. */
export function escapeLiteral(value: string): string {
  return value.replace(LITERAL_SPECIALS, "\\$&");
}

/** Make a replacement template literal, so `$&` stays as typed text. */
export function escapeReplacement(value: string): string {
  return value.replace(/\$/gu, "$$$$");
}

/** Build the source and flags used by the RegExp engine. */
export function buildPattern(
  find: string,
  options: ReplaceOptions,
): { source: string; flags: string } {
  const core = options.regexMode ? find : escapeLiteral(find);
  const source = options.wholeWord
    ? `(?<!${WORD_BOUNDARY})(?:${core})(?!${WORD_BOUNDARY})`
    : core;
  return { source, flags: `gu${options.caseSensitive ? "" : "i"}` };
}

interface RawHit {
  index: number;
  match: RegExpExecArray;
}

/**
 * Expand JavaScript replacement tokens ($&, $1, $`, $', $<name>, $$) without
 * calling eval. Unknown group references expand to an empty string.
 */
export function expandReplacement(
  template: string,
  match: RegExpExecArray,
  text: string,
): string {
  const whole = match[0];
  const before = text.slice(0, match.index);
  const after = text.slice(match.index + whole.length);
  const groups = match.slice(1);
  const named = match.groups ?? {};

  return template.replace(
    /\$(?:\$|&|`|'|<([^<>]+)>|(\d{1,2}))/gu,
    (token, name: string | undefined, digits: string | undefined) => {
      if (token === "$$") return "$";
      if (token === "$&") return whole;
      if (token === "$`") return before;
      if (token === "$'") return after;
      if (name !== undefined) return named[name] ?? "";
      const index = Number(digits ?? 0);
      if (index === 0) return whole;
      return groups[index - 1] ?? "";
    },
  );
}

/** Collect global matches, advancing manually past zero-length hits. */
function collectHits(regex: RegExp, text: string): { hits: RawHit[]; truncated: boolean } {
  const hits: RawHit[] = [];
  let guard = 0;

  while (guard <= text.length) {
    guard += 1;
    const match = regex.exec(text);
    if (!match) break;

    hits.push({ index: match.index, match });
    if (match[0].length === 0) {
      regex.lastIndex += 1;
      if (regex.lastIndex > text.length) break;
    }
    if (hits.length >= MAX_MATCHES) {
      return { hits, truncated: true };
    }
  }

  return { hits, truncated: false };
}

/** Rebuild the text from alternating untouched and replaced segments. */
function buildSegments(
  text: string,
  hits: RawHit[],
  replacement: string,
): ReplaceSegment[] {
  const segments: ReplaceSegment[] = [];
  let cursor = 0;

  for (const hit of hits) {
    if (hit.index < cursor) continue;
    if (hit.index > cursor) {
      segments.push({ text: text.slice(cursor, hit.index), replaced: false });
    }
    segments.push({
      text: expandReplacement(replacement, hit.match, text),
      replaced: true,
    });
    cursor = hit.index + hit.match[0].length;
  }

  if (cursor < text.length) {
    segments.push({ text: text.slice(cursor), replaced: false });
  }
  if (segments.length === 0 && text.length > 0) {
    segments.push({ text, replaced: false });
  }

  return segments;
}

/** Run a literal or regular-expression replacement and return typed errors. */
export function replaceText(
  text: string,
  find: string,
  replacement: string,
  options: ReplaceOptions,
): ReplaceResult {
  if (find.length === 0) {
    return { output: text, hits: [], segments: [], truncated: false, error: { code: "EMPTY_FIND" } };
  }
  if (
    text.length > MAX_INPUT_LENGTH ||
    find.length > MAX_INPUT_LENGTH ||
    replacement.length > MAX_INPUT_LENGTH
  ) {
    return { output: text, hits: [], segments: [], truncated: false, error: { code: "TOO_LARGE" } };
  }

  const { source, flags } = buildPattern(find, options);
  let regex: RegExp;
  try {
    regex = new RegExp(source, flags);
  } catch {
    return { output: text, hits: [], segments: [], truncated: false, error: { code: "INVALID_REGEX" } };
  }

  const template = options.regexMode ? replacement : escapeReplacement(replacement);
  const { hits, truncated } = collectHits(regex, text);
  const segments = buildSegments(text, hits, template);

  return {
    output: segments.map((segment) => segment.text).join(""),
    hits: hits.map((hit) => ({ index: hit.index, value: hit.match[0] })),
    segments,
    truncated,
  };
}
