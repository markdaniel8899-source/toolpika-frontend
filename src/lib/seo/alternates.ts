import type { Metadata } from "next";
import { routing } from "@/i18n/routing";
import { getSiteUrl } from "@/lib/site-url";

/**
 * Canonical + hreflang alternates for a localized public page.
 *
 * The origin always comes from getSiteUrl(), so preview deployments never
 * publish a canonical or hreflang URL on a vercel.app host.
 */
export function localizedAlternates(
  locale: string,
  path: string,
): NonNullable<Metadata["alternates"]> {
  const siteUrl = getSiteUrl();
  const normalized = path === "/" ? "" : `/${path.replace(/^\/+|\/+$/gu, "")}`;
  const localized = (targetLocale: string) =>
    `${siteUrl}/${targetLocale}${normalized}`;

  return {
    canonical: localized(locale),
    languages: {
      ...Object.fromEntries(
        routing.locales.map((alternate) => [alternate, localized(alternate)]),
      ),
      "x-default": localized(routing.defaultLocale),
    },
  };
}
