/** Returns a valid absolute site URL, even if the env var is malformed. */
export function getSiteUrl(): string {
  const fallback = "https://toolpika.site";
  const raw = process.env.NEXT_PUBLIC_SITE_URL;

  if (!raw) return fallback;

  try {
    const parsed = new URL(raw);
    if (parsed.protocol === "http:" || parsed.protocol === "https:") {
      return raw;
    }
  } catch {
    // Invalid env value - fall back to the production domain.
  }

  return fallback;
}
