import type { MetadataRoute } from "next";
import { routing } from "@/i18n/routing";
import { getSiteUrl } from "@/lib/site-url";
import { categories, getLiveTools } from "@/lib/tools/registry";

const SITE_URL = getSiteUrl();

/**
 * One sitemap with every locale path. Each entry carries hreflang alternates
 * for all 10 locales plus x-default.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const locales = routing.locales;
  const tools = getLiveTools();

  const entries: MetadataRoute.Sitemap = [];

  for (const locale of locales) {
    const paths = [
      "",
      "/all-tools",
      "/popular",
      "/new",
      "/guides",
      "/categories",
      "/request",
      "/about",
      "/privacy",
      "/terms",
      "/contact",
      ...categories.map((category) => `/category/${category.slug}`),
      ...tools.map((tool) => `/tools/${tool.slug}`),
    ];

    for (const path of paths) {
      entries.push({
        url: `${SITE_URL}/${locale}${path}`,
        lastModified: new Date(),
        changeFrequency: path === "" ? "daily" : "weekly",
        priority: path === "" ? 1 : path.startsWith("/tools/") ? 0.8 : 0.6,
        alternates: {
          languages: {
            ...Object.fromEntries(
              locales.map((alt) => [
                alt,
                `${SITE_URL}/${alt}${path}`,
              ])
            ),
            // Google falls back to x-default for unmatched languages.
            "x-default": `${SITE_URL}/${routing.defaultLocale}${path}`,
          },
        },
      });
    }
  }

  return entries;
}
