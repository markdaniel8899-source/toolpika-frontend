import type { ToolPageContent } from "@/lib/tools/tool-content";

export interface ToolSchemaInput {
  locale: string;
  siteUrl: string;
  title: string;
  slug: string;
  category: string;
  categoryLabel: string;
  homeLabel: string;
  description: string;
  content: ToolPageContent;
}

type JsonLd = Record<string, unknown>;

/**
 * Builds the per-tool schema set. Every text value comes from the same
 * messages that render the visible page, so the markup mirrors the page.
 */
export function buildToolSchemas({
  locale,
  siteUrl,
  title,
  slug,
  category,
  categoryLabel,
  homeLabel,
  description,
  content,
}: ToolSchemaInput): JsonLd[] {
  const canonical = `${siteUrl}/${locale}/tools/${slug}`;
  const categoryUrl = `${siteUrl}/${locale}/category/${category}`;
  const organization = {
    "@type": "Organization",
    name: "Toolpika",
    url: siteUrl,
  };

  return [
    {
      "@context": "https://schema.org",
      "@type": "WebApplication",
      name: title,
      url: canonical,
      description,
      applicationCategory: "UtilitiesApplication",
      operatingSystem: "Any (web browser)",
      browserRequirements: "Requires a modern web browser",
      inLanguage: locale,
      isAccessibleForFree: true,
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "USD",
      },
      publisher: organization,
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
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
          name: categoryLabel,
          item: categoryUrl,
        },
        {
          "@type": "ListItem",
          position: 3,
          name: title,
          item: canonical,
        },
      ],
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: content.faqs.map((faq) => ({
        "@type": "Question",
        name: faq.question,
        acceptedAnswer: {
          "@type": "Answer",
          text: faq.answer,
        },
      })),
    },
  ];
}
