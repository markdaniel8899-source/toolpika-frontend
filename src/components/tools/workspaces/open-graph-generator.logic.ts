/** Pure Open Graph and Twitter Card builder. No DOM, no React, no translated strings. */

export type OgType = "website" | "article" | "product" | "profile";
export type TwitterCard = "summary" | "summary_large_image" | "app" | "player";

export interface OpenGraphInput {
  title: string;
  description: string;
  url: string;
  type: OgType;
  image: string;
  twitterCard: TwitterCard;
}

export type OpenGraphErrorCode = "EMPTY";

export interface OpenGraphResult {
  html: string;
  tagCount: number;
  error?: OpenGraphErrorCode;
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
 * Assemble a share-preview block. Text fields are optional and skipped when
 * blank; the type and card tags always use the selected preset.
 */
export function buildOpenGraphTags(input: OpenGraphInput): OpenGraphResult {
  const title = input.title.trim();
  const description = input.description.trim();
  const url = input.url.trim();
  const image = input.image.trim();

  if (!title && !description && !url && !image) {
    return { html: "", tagCount: 0, error: "EMPTY" };
  }

  const lines: string[] = [];
  if (title) {
    lines.push(`<meta property="og:title" content="${escapeHtml(title)}">`);
  }
  if (description) {
    lines.push(`<meta property="og:description" content="${escapeHtml(description)}">`);
  }
  if (url) {
    lines.push(`<meta property="og:url" content="${escapeHtml(url)}">`);
  }
  lines.push(`<meta property="og:type" content="${escapeHtml(input.type)}">`);
  if (image) {
    lines.push(`<meta property="og:image" content="${escapeHtml(image)}">`);
  }
  lines.push(`<meta name="twitter:card" content="${escapeHtml(input.twitterCard)}">`);

  return { html: lines.join("\n"), tagCount: lines.length };
}
