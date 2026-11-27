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

/** Absolute, locale-prefixed URL for a page path. */
function localizedUrl(siteUrl: string, locale: string, path: string): string {
  const normalized = path === "/" ? "" : `/${path.replace(/^\/+|\/+$/gu, "")}`;
  return `${siteUrl}/${locale}${normalized}`;
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
      // Same details rendered on the public /contact page.
      contactPoint: {
        "@type": "ContactPoint",
        contactType: "customer support",
        email: "hafizmzain786@gmail.com",
        telephone: "+923074477250",
      },
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

interface PageSchemaInput {
  locale: string;
  siteUrl: string;
  path: string;
  name: string;
  description: string;
}

/** Generic WebPage entity for static pages that have no richer schema. */
export function buildWebPageSchemas({
  locale,
  siteUrl,
  path,
  name,
  description,
}: PageSchemaInput): JsonLd[] {
  const url = localizedUrl(siteUrl, locale, path);

  return [
    {
      "@context": "https://schema.org",
      "@type": "WebPage",
      "@id": `${url}#webpage`,
      url,
      name,
      description,
      inLanguage: locale,
      isPartOf: { "@id": `${siteUrl}/#website` },
    },
  ];
}

/** Tool listing pages: the visible grid as a CollectionPage + ItemList. */
export function buildToolListSchemas({
  locale,
  siteUrl,
  path,
  name,
  description,
  items,
}: PageSchemaInput & {
  items: Array<{ name: string; url: string }>;
}): JsonLd[] {
  const url = localizedUrl(siteUrl, locale, path);

  return [
    {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      "@id": `${url}#collection`,
      url,
      name,
      description,
      inLanguage: locale,
      isPartOf: { "@id": `${siteUrl}/#website` },
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
  ];
}

/** Contact page linked to the site-wide Organization contact point. */
export function buildContactPageSchemas({
  locale,
  siteUrl,
  name,
  description,
}: Omit<PageSchemaInput, "path">): JsonLd[] {
  const url = localizedUrl(siteUrl, locale, "/contact");

  return [
    {
      "@context": "https://schema.org",
      "@type": "ContactPage",
      "@id": `${url}#webpage`,
      url,
      name,
      description,
      inLanguage: locale,
      isPartOf: { "@id": `${siteUrl}/#website` },
      about: { "@id": `${siteUrl}/#organization` },
    },
  ];
}
