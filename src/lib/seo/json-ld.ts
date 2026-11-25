/**
 * Shared JSON-LD helpers for localized public pages.
 *
 * Every value passed to these builders comes from the same translated
 * messages that render the visible page, so schema text never drifts from
 * what a reader sees.
 */

export type JsonLd = Record<string, unknown>;

/** Escape "<" so a translated value can never break out of a script tag. */
export function serializeJsonLd(schema: JsonLd): string {
  return JSON.stringify(schema).replace(/</g, "\\u003c");
}

/** Site-wide Organization + WebSite entities, emitted once per locale layout. */
export function buildSiteSchemas({
  locale,
  siteUrl,
}: {
  locale: string;
  siteUrl: string;
}): JsonLd[] {
  const organizationId = `${siteUrl}/#organization`;

  return [
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      "@id": organizationId,
      name: "Toolpika",
      url: siteUrl,
      logo: `${siteUrl}/favicon.svg`,
      // This profile is already linked publicly in the site footer.
      sameAs: ["https://github.com/toolpika"],
    },
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      "@id": `${siteUrl}/#website`,
      name: "Toolpika",
      url: siteUrl,
      inLanguage: locale,
      publisher: { "@id": organizationId },
    },
  ];
}

/** Category page: the visible tool grid as a CollectionPage + breadcrumb. */
export function buildCategorySchemas({
  locale,
  siteUrl,
  slug,
  label,
  description,
  homeLabel,
  items,
}: {
  locale: string;
  siteUrl: string;
  slug: string;
  label: string;
  description: string;
  homeLabel: string;
  items: Array<{ name: string; url: string }>;
}): JsonLd[] {
  const categoryUrl = `${siteUrl}/${locale}/category/${slug}`;

  return [
    {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      "@id": `${categoryUrl}#collection`,
      name: label,
      url: categoryUrl,
      description,
      inLanguage: locale,
      mainEntity: {
        "@type": "ItemList",
        itemListElement: items.map((item, index) => ({
          "@type": "ListItem",
          position: index + 1,
          name: item.name,
          url: item.url,
        })),
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      "@id": `${categoryUrl}#breadcrumb`,
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: homeLabel,
          item: `${siteUrl}/${locale}`,
        },
        {
          "@type": "ListItem",
          position: 2,
          name: label,
          item: categoryUrl,
        },
      ],
    },
  ];
}
