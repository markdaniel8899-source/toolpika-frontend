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
 * One consolidated @graph per localized tool page. Every text value comes
 * from the same messages that render the visible page, so the markup mirrors
 * the page exactly and FAQ answers never drift from what a reader sees.
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
  const organizationId = `${siteUrl}/#organization`;
  const appId = `${canonical}#webapp`;
  const faqId = `${canonical}#faq`;
  const categoryUrl = `${siteUrl}/${locale}/category/${category}`;

  return [
    {
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "Organization",
          "@id": organizationId,
          name: "Toolpika",
          url: siteUrl,
        },
        {
          "@type": "WebApplication",
          "@id": appId,
          name: title,
          url: canonical,
          description,
          applicationCategory: "UtilitiesApplication",
          applicationSubCategory: categoryLabel,
          operatingSystem: "Any (web browser)",
          browserRequirements: "Requires a modern web browser",
          inLanguage: locale,
          isAccessibleForFree: true,
          featureList: content.features.map((feature) => feature.title),
          // Explicit long-tail topics keep each tool's entity distinct.
          about: content.searchIntents.map((name) => ({
            "@type": "Thing",
            name,
          })),
          offers: {
            "@type": "Offer",
            price: "0",
            priceCurrency: "USD",
          },
          publisher: { "@id": organizationId },
        },
        {
          "@type": "BreadcrumbList",
          "@id": `${canonical}#breadcrumb`,
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
          "@type": "FAQPage",
          "@id": faqId,
          isPartOf: { "@id": appId },
          inLanguage: locale,
          mainEntity: content.faqs.map((faq) => ({
            "@type": "Question",
            name: faq.question,
            acceptedAnswer: {
              "@type": "Answer",
              text: faq.answer,
            },
          })),
        },
      ],
    },
  ];
}
