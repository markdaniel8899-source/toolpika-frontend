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

/** Tools a reader would realistically use next to the current task. */
const CURATED_RELATED: Record<string, string[]> = {
  "word-counter": ["case-converter", "json-formatter", "url-encoder", "unit-converter", "image-compressor"],
  "case-converter": ["word-counter", "json-formatter", "base64-encoder", "unit-converter", "password-generator"],
  "image-compressor": ["word-counter", "json-formatter", "base64-encoder"],
  "json-formatter": ["word-counter", "case-converter", "image-compressor", "base64-encoder", "unit-converter"],
  "unit-converter": ["word-counter", "case-converter", "json-formatter"],
  "password-generator": ["base64-encoder", "url-encoder", "case-converter"],
  "url-encoder": ["word-counter", "base64-encoder", "password-generator"],
  "base64-encoder": ["case-converter", "image-compressor", "json-formatter", "url-encoder", "password-generator"],
};

/** Matches the contextual link written into each tool's page copy. */
const CONTEXTUAL_TOOL: Record<string, string> = {
  "word-counter": "case-converter",
  "case-converter": "word-counter",
  "image-compressor": "word-counter",
  "json-formatter": "word-counter",
  "unit-converter": "case-converter",
  "password-generator": "case-converter",
  "url-encoder": "base64-encoder",
  "base64-encoder": "case-converter",
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
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(schema).replace(/</g, "\\u003c"),
          }}
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
