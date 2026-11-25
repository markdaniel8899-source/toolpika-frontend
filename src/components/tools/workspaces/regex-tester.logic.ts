/** Pure, dependency-free regular-expression tester. No DOM or React access. */

export interface RegexMatch {
  match: string;
  index: number;
  groups: string[];
}

export type RegexErrorCode =
  | "INVALID_PATTERN"
  | "INVALID_FLAG"
  | "TOO_MANY_MATCHES";

export interface RegexResult {
  matches: RegexMatch[];
  error?: { code: RegexErrorCode };
  truncated: boolean;
  elapsedMs?: number;
}

export interface HighlightSegment {
  text: string;
  hit: boolean;
}

export const MAX_MATCHES = 200;

const ALLOWED_FLAGS = new Set(["g", "i", "m", "s", "u", "y", "d"]);

function timestamp(): number {
  return typeof performance !== "undefined" ? performance.now() : Date.now();
}

function validFlags(flags: string): boolean {
  const seen = new Set<string>();
  for (const flag of flags) {
    if (!ALLOWED_FLAGS.has(flag) || seen.has(flag)) return false;
    seen.add(flag);
  }
  return true;
}

function toMatch(found: RegExpExecArray): RegexMatch {
  return {
    match: found[0],
    index: found.index,
    groups: found.slice(1).map((group) => group ?? ""),
  };
}

function collect(regex: RegExp, text: string) {
  const matches: RegexMatch[] = [];

  if (!regex.global && !regex.sticky) {
    const found = regex.exec(text);
    if (found) matches.push(toMatch(found));
    return { matches, truncated: false };
  }

  let emptyStreak = 0;
  while (emptyStreak <= text.length) {
    const found = regex.exec(text);
    if (!found) break;

    matches.push(toMatch(found));
    emptyStreak += 1;

    if (found[0].length === 0) {
      // A zero-length hit never moves lastIndex on its own; advance manually.
      regex.lastIndex += 1;
      if (regex.lastIndex > text.length) break;
    }

    if (matches.length >= MAX_MATCHES) {
      const extra = regex.exec(text);
      return { matches, truncated: extra !== null };
    }
  }

  return { matches, truncated: false };
}

/** Compile and run a pattern, returning typed errors instead of throwing. */
export function testRegex(
  pattern: string,
  flags: string,
  text: string,
): RegexResult {
  const started = timestamp();
  const finish = (
    result: Omit<RegexResult, "elapsedMs">,
  ): RegexResult => ({
    ...result,
    elapsedMs: Math.round((timestamp() - started) * 100) / 100,
  });

  if (!validFlags(flags)) {
    return finish({ matches: [], truncated: false, error: { code: "INVALID_FLAG" } });
  }
  if (pattern === "") {
    return finish({
      matches: [],
      truncated: false,
      error: { code: "INVALID_PATTERN" },
    });
  }

  let regex: RegExp;
  try {
    regex = new RegExp(pattern, flags);
  } catch {
    return finish({
      matches: [],
      truncated: false,
      error: { code: "INVALID_PATTERN" },
    });
  }

  try {
    const { matches, truncated } = collect(regex, text);
    return finish({
      matches,
      truncated,
      ...(truncated ? { error: { code: "TOO_MANY_MATCHES" as const } } : {}),
    });
  } catch {
    return finish({
      matches: [],
      truncated: false,
      error: { code: "INVALID_PATTERN" },
    });
  }
}

/** Turn match offsets into ordered, non-overlapping highlight segments. */
export function highlightSegments(
  text: string,
  matches: RegexMatch[],
): HighlightSegment[] {
  const hits = matches
    .filter((match) => match.match.length > 0 && match.index >= 0)
    .sort((a, b) => a.index - b.index);

  const segments: HighlightSegment[] = [];
  let cursor = 0;

  for (const hit of hits) {
    if (hit.index < cursor) continue;
    if (hit.index > cursor) {
      segments.push({ text: text.slice(cursor, hit.index), hit: false });
    }
    const end = Math.min(hit.index + hit.match.length, text.length);
    segments.push({ text: text.slice(hit.index, end), hit: true });
    cursor = end;
  }

  if (cursor < text.length) {
    segments.push({ text: text.slice(cursor), hit: false });
  }
  if (segments.length === 0 && text.length > 0) {
    segments.push({ text, hit: false });
  }

  return segments;
}
