/**
 * Canonical production origin.
 *
 * Only an explicitly configured custom domain is accepted. Preview hosts
 * (`*.vercel.app`, localhost, IP addresses) are ignored so canonical tags,
 * hreflang, sitemap and robots never point at a deployment URL.
 */
export function getSiteUrl(): string {
  const fallback = "https://toolpika.site";
  const raw = process.env.NEXT_PUBLIC_SITE_URL;

  if (!raw) return fallback;

  try {
    const parsed = new URL(raw);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return fallback;
    }

    const host = parsed.hostname.toLowerCase();
    const isPreview =
      host === "localhost" ||
      host.endsWith(".localhost") ||
      host.endsWith(".vercel.app") ||
      host.endsWith(".vercel.dev") ||
      /^\d{1,3}(\.\d{1,3}){3}$/.test(host);

    if (isPreview) return fallback;

    return `${parsed.origin}${parsed.pathname.replace(/\/$/u, "")}`;
  } catch {
    return fallback;
  }
}
