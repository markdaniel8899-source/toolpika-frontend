/** Pure UTM URL handling. No DOM, no React, no translated strings. */

export type UtmErrorCode = "INVALID_URL" | "MISSING_REQUIRED" | "EMPTY";
export type UtmParam = { key: string; value: string };

export interface UtmInput {
  baseUrl: string;
  source: string;
  medium: string;
  campaign: string;
  term?: string;
  content?: string;
  id?: string;
}

export interface UtmBuildOptions {
  lowerCaseValues?: boolean;
  keepFragment?: boolean;
}

export interface UtmBuildResult {
  url: string;
  params: UtmParam[];
  error?: UtmErrorCode;
}

export interface ParsedUtm {
  baseUrl: string;
  source: string;
  medium: string;
  campaign: string;
  term: string;
  content: string;
  id: string;
}

const UTM_KEYS = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_term",
  "utm_content",
  "utm_id",
] as const;

/** Add https:// when the address has no scheme, then validate the host. */
function toUrl(raw: string): URL | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;

  const hasScheme = /^[a-z][a-z\d+.-]*:\/\//iu.test(trimmed);
  const candidate = hasScheme ? trimmed : `https://${trimmed.replace(/^\/\//u, "")}`;

  try {
    const url = new URL(candidate);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    if (!url.hostname || /\s/u.test(url.hostname)) return null;
    return url;
  } catch {
    return null;
  }
}

/**
 * Build a tracked URL without losing query parameters that are already there.
 * Empty optional fields are skipped, and values are left to URLSearchParams
 * for correct encoding.
 */
export function buildUtmUrl(
  input: UtmInput,
  options: UtmBuildOptions = {},
): UtmBuildResult {
  const baseUrl = input.baseUrl.trim();
  const source = input.source.trim();
  const medium = input.medium.trim();
  const campaign = input.campaign.trim();
  const term = (input.term ?? "").trim();
  const content = (input.content ?? "").trim();
  const id = (input.id ?? "").trim();

  const everythingEmpty = [baseUrl, source, medium, campaign, term, content, id]
    .every((value) => value.length === 0);
  if (everythingEmpty) return { url: "", params: [], error: "EMPTY" };
  if (!baseUrl || !source || !medium || !campaign) {
    return { url: "", params: [], error: "MISSING_REQUIRED" };
  }

  const url = toUrl(baseUrl);
  if (!url) return { url: "", params: [], error: "INVALID_URL" };

  const normalize = (value: string) =>
    options.lowerCaseValues === true ? value.toLowerCase() : value;
  const fields: UtmParam[] = [
    { key: "utm_source", value: source },
    { key: "utm_medium", value: medium },
    { key: "utm_campaign", value: campaign },
    { key: "utm_term", value: term },
    { key: "utm_content", value: content },
    { key: "utm_id", value: id },
  ];

  for (const field of fields) {
    if (field.value) url.searchParams.set(field.key, normalize(field.value));
  }

  if (options.keepFragment !== true) url.hash = "";

  return {
    url: url.toString(),
    params: Array.from(url.searchParams.entries()).map(([key, value]) => ({
      key,
      value,
    })),
  };
}

/** Read an existing campaign URL back into editable fields. */
export function parseUtmUrl(rawUrl: string): ParsedUtm | null {
  const url = toUrl(rawUrl);
  if (!url) return null;

  const read = (key: string) => url.searchParams.get(key) ?? "";
  const parsed: ParsedUtm = {
    baseUrl: "",
    source: read("utm_source"),
    medium: read("utm_medium"),
    campaign: read("utm_campaign"),
    term: read("utm_term"),
    content: read("utm_content"),
    id: read("utm_id"),
  };

  for (const key of UTM_KEYS) url.searchParams.delete(key);
  parsed.baseUrl = url.toString();
  return parsed;
}
