import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getSiteUrl } from "@/lib/site-url";
import {
  getTool,
  getLiveTools,
  getToolsByCategory,
  toolTitleKey,
  toolSeoTitleKey,
  toolSeoDescriptionKey,
} from "@/lib/tools/registry";
import { getToolPageContent } from "@/lib/tools/tool-content";
import { buildToolSchemas } from "@/lib/tools/tool-schema";
import { serializeJsonLd } from "@/lib/seo/json-ld";
import { FullToolPage } from "@/components/tools/full-tool-page";

const LOCALES = [
  "en", "de", "fr", "es", "pt-BR", "ru", "tr", "it", "ar", "hi",
] as const;

const OG_LOCALES: Record<string, string> = {
  en: "en_US",
  de: "de_DE",
  fr: "fr_FR",
  es: "es_ES",
  "pt-BR": "pt_BR",
  ru: "ru_RU",
  tr: "tr_TR",
  it: "it_IT",
  ar: "ar_AE",
  hi: "hi_IN",
};

/**
 * Tools a reader would realistically use next to the current task.
 * Every edge is mutual: if A lists B, B also lists A.
 */
const CURATED_RELATED: Record<string, string[]> = {
  "word-counter": ["text-diff-checker", "case-converter", "lorem-ipsum-generator", "markdown-to-html", "url-encoder", "image-compressor"],
  "case-converter": ["slug-generator", "word-counter", "markdown-to-html", "json-formatter", "base64-encoder", "password-generator"],
  "image-compressor": ["image-resizer", "base64-encoder", "color-converter", "word-counter", "percentage-calculator", "aspect-ratio-calculator"],
  "json-formatter": ["json-to-csv", "yaml-to-json", "case-converter", "regex-tester", "base64-encoder", "timestamp-converter"],
  "unit-converter": ["percentage-calculator", "number-base-converter", "data-storage-converter", "color-converter"],
  "password-generator": ["hash-generator", "jwt-decoder", "uuid-generator", "base64-encoder", "url-encoder", "case-converter"],
  "url-encoder": ["utm-builder", "word-counter", "slug-generator", "base64-encoder", "password-generator"],
  "base64-encoder": ["image-compressor", "json-formatter", "json-to-csv", "url-encoder", "password-generator", "case-converter"],
  "json-to-csv": ["json-formatter", "yaml-to-json", "markdown-to-html", "base64-encoder"],
  "markdown-to-html": ["lorem-ipsum-generator", "slug-generator", "word-counter", "case-converter", "json-to-csv", "text-diff-checker"],
  "color-converter": ["number-base-converter", "unit-converter", "image-compressor", "image-resizer"],
  "number-base-converter": ["color-converter", "unit-converter", "data-storage-converter", "uuid-generator", "jwt-decoder", "hash-generator"],
  "timestamp-converter": ["data-storage-converter", "jwt-decoder", "regex-tester", "json-formatter"],
  "data-storage-converter": ["timestamp-converter", "unit-converter", "number-base-converter", "image-resizer"],
  "slug-generator": ["case-converter", "url-encoder", "markdown-to-html", "utm-builder"],
  "yaml-to-json": ["regex-tester", "json-formatter", "json-to-csv"],
  "lorem-ipsum-generator": ["markdown-to-html", "word-counter", "text-diff-checker"],
  "text-diff-checker": ["word-counter", "lorem-ipsum-generator", "markdown-to-html", "regex-tester", "utm-builder"],
  "uuid-generator": ["jwt-decoder", "password-generator", "number-base-converter", "regex-tester"],
  "jwt-decoder": ["uuid-generator", "timestamp-converter", "password-generator", "hash-generator", "regex-tester", "number-base-converter"],
  "regex-tester": ["yaml-to-json", "text-diff-checker", "json-formatter", "timestamp-converter", "jwt-decoder", "uuid-generator"],
  "percentage-calculator": ["unit-converter", "aspect-ratio-calculator", "image-compressor"],
  "aspect-ratio-calculator": ["image-resizer", "image-compressor", "percentage-calculator"],
  "utm-builder": ["url-encoder", "slug-generator", "text-diff-checker"],
  "hash-generator": ["password-generator", "jwt-decoder", "number-base-converter"],
  "image-resizer": ["aspect-ratio-calculator", "image-compressor", "color-converter", "data-storage-converter"],
  "remove-duplicate-lines": ["sort-text-lines", "find-and-replace-text", "character-frequency-counter", "readability-score-checker"],
  "sort-text-lines": ["remove-duplicate-lines", "find-and-replace-text", "character-frequency-counter"],
  "find-and-replace-text": ["remove-duplicate-lines", "sort-text-lines", "character-frequency-counter", "readability-score-checker"],
  "character-frequency-counter": ["remove-duplicate-lines", "sort-text-lines", "find-and-replace-text", "readability-score-checker"],
  "readability-score-checker": ["find-and-replace-text", "character-frequency-counter", "remove-duplicate-lines"],
  "html-formatter": ["css-formatter", "sql-formatter", "css-minifier"],
  "css-formatter": ["html-formatter", "js-minifier", "css-minifier", "sql-formatter"],
  "css-minifier": ["css-formatter", "js-minifier", "html-formatter"],
  "js-minifier": ["css-minifier", "css-formatter", "sql-formatter"],
  "sql-formatter": ["js-minifier", "html-formatter", "css-formatter"],
};

/** Matches the contextual %%TOOL%% link written into each tool's About copy. */
const CONTEXTUAL_TOOL: Record<string, string> = {
  "word-counter": "text-diff-checker",
  "text-diff-checker": "word-counter",
  "case-converter": "slug-generator",
  "slug-generator": "case-converter",
  "lorem-ipsum-generator": "markdown-to-html",
  "markdown-to-html": "lorem-ipsum-generator",
  "json-formatter": "json-to-csv",
  "json-to-csv": "json-formatter",
  "yaml-to-json": "regex-tester",
  "regex-tester": "yaml-to-json",
  "base64-encoder": "image-compressor",
  "image-compressor": "base64-encoder",
  "image-resizer": "aspect-ratio-calculator",
  "aspect-ratio-calculator": "image-resizer",
  "percentage-calculator": "unit-converter",
  "unit-converter": "percentage-calculator",
  "color-converter": "number-base-converter",
  "number-base-converter": "color-converter",
  "timestamp-converter": "data-storage-converter",
  "data-storage-converter": "timestamp-converter",
  "password-generator": "hash-generator",
  "hash-generator": "password-generator",
  "uuid-generator": "jwt-decoder",
  "jwt-decoder": "uuid-generator",
  "utm-builder": "url-encoder",
  "url-encoder": "utm-builder",
  "remove-duplicate-lines": "sort-text-lines",
  "sort-text-lines": "remove-duplicate-lines",
  "find-and-replace-text": "character-frequency-counter",
  "character-frequency-counter": "find-and-replace-text",
  "html-formatter": "sql-formatter",
  "css-formatter": "js-minifier",
  "js-minifier": "css-formatter",
  "sql-formatter": "html-formatter",
};

type LocalePageProps = {
  params: Promise<{ locale: string; slug: string }>;
};

export function generateStaticParams() {
  return getLiveTools().flatMap((tool) =>
    LOCALES.map((locale) => ({ locale, slug: tool.slug })),
  );
}

export async function generateMetadata({
  params,
}: LocalePageProps): Promise<Metadata> {
  const { slug, locale } = await params;
  const tool = getTool(slug);
  const t = await getTranslations({ locale, namespace: "tools" });
  if (!tool) return { title: t("notFound") };

  const siteUrl = getSiteUrl();
  const pageTitle = t(toolSeoTitleKey(tool));
  const pageDescription = t(toolSeoDescriptionKey(tool));
  const pageContent = getToolPageContent(t, slug);

  return {
    title: pageTitle,
    description: pageDescription,
    keywords: pageContent?.searchIntents ?? [],
    alternates: {
      canonical: `${siteUrl}/${locale}/tools/${tool.slug}`,
      languages: {
        ...Object.fromEntries(
          LOCALES.map((alt) => [alt, `${siteUrl}/${alt}/tools/${tool.slug}`]),
        ),
        "x-default": `${siteUrl}/en/tools/${tool.slug}`,
      },
    },
    openGraph: {
      title: pageTitle,
      description: pageDescription,
      type: "website",
      url: `${siteUrl}/${locale}/tools/${tool.slug}`,
      locale: OG_LOCALES[locale] ?? "en_US",
    },
    twitter: {
      card: "summary_large_image",
      title: pageTitle,
      description: pageDescription,
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}

/** Human-readable category label shared by metadata and the page body. */
function getCategoryLabel(
  category: string,
  t: (key: string) => string,
): string {
  const map: Record<string, string> = {
    text: t("catText"),
    image: t("catImage"),
    code: t("catCode"),
    converter: t("catConverter"),
    security: t("catSecurity"),
    calculator: t("catCalculator"),
  };
  return map[category] ?? category;
}

export default async function ToolPage({ params }: LocalePageProps) {
  const { slug, locale } = await params;
  const tool = getTool(slug);
  if (!tool) notFound();

  const t = await getTranslations({ locale, namespace: "tools" });
  const tHow = await getTranslations({ locale, namespace: "toolPage" });
  const tUi = await getTranslations({ locale, namespace: "toolUi" });

  const toolTitle = t(toolTitleKey(tool));
  const pageDescription = t(toolSeoDescriptionKey(tool));
  const categoryLabel = getCategoryLabel(tool.category, t);
  const fullContent = getToolPageContent(t, slug);

  // Every registered tool is expected to hand-written full content. A missing
  // content set is a configuration error, not a reason to ship a thin page.
  if (!fullContent) notFound();

  // Hand-picked related tools where they exist; same-category tools first
  // otherwise, with top popular as a fallback when fewer than three.
  const related = (() => {
    const curated = (CURATED_RELATED[slug] ?? [])
      .map((relatedSlug) => getTool(relatedSlug))
      .filter((item): item is NonNullable<typeof item> => Boolean(item));
    if (curated.length > 0) return curated;

    const list = getToolsByCategory(tool.category)
      .filter((item) => item.slug !== tool.slug)
      .slice(0, 4);
    if (list.length < 3) {
      const seen = new Set([tool.slug, ...list.map((item) => item.slug)]);
      for (const fallback of getLiveTools()) {
        if (list.length >= 4) break;
        if (!seen.has(fallback.slug)) {
          list.push(fallback);
          seen.add(fallback.slug);
        }
      }
    }
    return list;
  })();

  const contextualSlug = CONTEXTUAL_TOOL[slug];
  const contextualToolBase =
    related.find((item) => item.slug === contextualSlug) ??
    (contextualSlug ? getTool(contextualSlug) : undefined) ??
    related[0];
  const contextualTool = contextualToolBase
    ? {
        ...contextualToolBase,
        title: t(toolTitleKey(contextualToolBase)),
      }
    : undefined;

  const toolSchemas = buildToolSchemas({
    locale,
    siteUrl: getSiteUrl(),
    title: toolTitle,
    slug: tool.slug,
    category: tool.category,
    categoryLabel,
    homeLabel: t("home"),
    description: pageDescription,
    content: fullContent,
  });

  return (
    <>
      {toolSchemas.map((schema, index) => (
        <script
          key={index}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: serializeJsonLd(schema) }}
        />
      ))}
      <FullToolPage
        tool={tool}
        title={toolTitle}
        content={fullContent}
        related={related}
        homeLabel={t("home")}
        categoryLabel={categoryLabel}
        relatedTitle={tHow("relatedTitle")}
        inputLabel={t("input")}
        outputLabel={t("result")}
        workspaceLabel={t("workspaceLabel", { title: toolTitle })}
        contextualTool={contextualTool}
        onThisPageLabel={t("onThisPage")}
        quickAnswerLabel={t("quickAnswer")}
        quickFactsLabel={t("quickFacts")}
        freeLabel={t("freeToUse")}
        noSignupLabel={t("noSignup")}
        privacyLabel={t("runsInBrowser")}
        copyLabel={tUi("copy")}
        copiedLabel={tUi("copied")}
      />
    </>
  );
}
