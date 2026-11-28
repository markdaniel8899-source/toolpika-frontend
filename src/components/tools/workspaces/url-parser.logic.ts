/** Pure URL parsing and rebuilding helpers. No DOM or browser state. */

export interface UrlParamRow {
  /** Stable row id supplied by the caller or derived from the parse index. */
  id: string;
  key: string;
  value: string;
}

export interface UrlParts {
  protocol: string;
  host: string;
  pathname: string;
  hash: string;
  /** One row per search pair, so repeated keys are preserved. */
  params: UrlParamRow[];
}

export type UrlParseReason = "empty" | "relative" | "invalid";

export type UrlParseResult =
  | { ok: true; parts: UrlParts }
  | { ok: false; reason: UrlParseReason };

export const URL_SAMPLE = "https://example.com/products?category=tools&page=2#reviews";

export const EMPTY_URL_PARTS: UrlParts = {
  protocol: "https",
  host: "",
  pathname: "",
  hash: "",
  params: [],
};

const SCHEME = /^[A-Za-z][A-Za-z0-9+.-]*:/u;

/** Parse with the platform URL API; classify the failure for a fix hint. */
export function parseUrl(raw: string): UrlParseResult {
  const value = raw.trim();
  if (!value) return { ok: false, reason: "empty" };

  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return { ok: false, reason: SCHEME.test(value) ? "invalid" : "relative" };
  }

  const params = Array.from(url.searchParams.entries()).map(([key, item], index) => ({
    id: `p${index}`,
    key,
    value: item,
  }));

  return {
    ok: true,
    parts: {
      protocol: url.protocol.replace(/:$/u, ""),
      host: url.host,
      pathname: url.pathname,
      hash: url.hash.replace(/^#/u, ""),
      params,
    },
  };
}

/** Rebuild a URL from editable parts. Keys and values are encoded once here. */
export function buildUrl(parts: UrlParts): string {
  const scheme = parts.protocol.trim().replace(/:$/u, "");
  const host = parts.host.trim();
  const rawPath = parts.pathname.trim();
  const path = rawPath && !rawPath.startsWith("/") ? `/${rawPath}` : rawPath;

  const query = parts.params
    .filter((row) => row.key.trim().length > 0)
    .map((row) => `${encodeURIComponent(row.key.trim())}=${encodeURIComponent(row.value)}`)
    .join("&");

  const hash = parts.hash.trim().replace(/^#/u, "");

  return `${scheme}:${host ? `//${host}` : ""}${path}${query ? `?${query}` : ""}${hash ? `#${hash}` : ""}`;
}

/** True when every field is blank, used for the empty result state. */
export function isPartsEmpty(parts: UrlParts): boolean {
  return (
    !parts.protocol.trim() &&
    !parts.host.trim() &&
    !parts.pathname.trim() &&
    !parts.hash.trim() &&
    parts.params.length === 0
  );
}

/** A fresh row id from a caller owned counter, safe against list reordering. */
export function nextParamId(counter: number): string {
  return `new${counter}`;
}
