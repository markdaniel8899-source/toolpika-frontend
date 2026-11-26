/** Pure meta tag builder. No DOM, no React, no translated strings. */

export type RobotsDirective =
  | "index, follow"
  | "noindex, follow"
  | "index, nofollow"
  | "noindex, nofollow";

export interface MetaTagInput {
  title: string;
  description: string;
  canonicalUrl: string;
  robots: RobotsDirective;
  themeColor: string;
}

export type MetaTagErrorCode = "EMPTY";

export interface MetaTagResult {
  html: string;
  tagCount: number;
  error?: MetaTagErrorCode;
}

/** Escape the characters that carry meaning in HTML text or attributes. */
export function escapeHtml(value: string): string {
  return value
    .replace(/&/gu, "&amp;")
    .replace(/</gu, "&lt;")
    .replace(/>/gu, "&gt;")
    .replace(/"/gu, "&quot;")
    .replace(/'/gu, "&#39;");
}

/**
 * Assemble a head block from five plain fields. Empty text fields are skipped;
 * the robots directive is always written once the block has any content.
 */
export function buildMetaTags(input: MetaTagInput): MetaTagResult {
  const title = input.title.trim();
  const description = input.description.trim();
  const canonical = input.canonicalUrl.trim();
  const theme = input.themeColor.trim();

  if (!title && !description && !canonical && !theme) {
    return { html: "", tagCount: 0, error: "EMPTY" };
  }

  const lines: string[] = [];
  if (title) lines.push(`<title>${escapeHtml(title)}</title>`);
  if (description) {
    lines.push(`<meta name="description" content="${escapeHtml(description)}">`);
  }
  if (canonical) {
    lines.push(`<link rel="canonical" href="${escapeHtml(canonical)}">`);
  }
  lines.push(`<meta name="robots" content="${escapeHtml(input.robots)}">`);
  if (theme) {
    lines.push(`<meta name="theme-color" content="${escapeHtml(theme)}">`);
  }

  return { html: lines.join("\n"), tagCount: lines.length };
}
