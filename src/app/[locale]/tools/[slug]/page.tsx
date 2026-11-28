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
  "word-counter": ["text-diff-checker","case-converter","lorem-ipsum-generator","markdown-to-html","url-encoder","five-letter-word-finder","reading-time-calculator","text-repeater","reverse-text"],
  "case-converter": ["slug-generator","word-counter","markdown-to-html","json-formatter","fancy-font-generator","text-repeater","reverse-text","fancy-text-generator"],
  "image-compressor": ["image-resizer","base64-encoder","color-converter","percentage-calculator","aspect-ratio-calculator","video-size-calculator","image-format-converter","exif-metadata-remover"],
  "json-formatter": ["json-to-csv","yaml-to-json","case-converter","regex-tester","base64-encoder","timestamp-converter","json-to-typescript","xml-to-json"],
  "unit-converter": ["percentage-calculator","number-base-converter","data-storage-converter","color-converter","fuel-cost-calculator","cooking-converter","electricity-bill-calculator"],
  "password-generator": ["hash-generator","jwt-decoder","uuid-generator","personality-quiz","random-choice-picker","chmod-calculator","password-strength-checker","bcrypt-generator"],
  "url-encoder": ["utm-builder","word-counter","slug-generator","base64-encoder","url-parser","html-entity-encoder"],
  "base64-encoder": ["image-compressor","json-formatter","json-to-csv","url-encoder","image-to-base64"],
  "json-to-csv": ["json-formatter","yaml-to-json","markdown-to-html","base64-encoder","csv-to-json"],
  "markdown-to-html": ["lorem-ipsum-generator","slug-generator","word-counter","case-converter","json-to-csv","text-diff-checker"],
  "color-converter": ["number-base-converter","unit-converter","image-compressor","image-resizer","image-color-picker"],
  "number-base-converter": ["color-converter","unit-converter","data-storage-converter","uuid-generator","jwt-decoder","hash-generator","roman-numeral-converter"],
  "timestamp-converter": ["data-storage-converter","jwt-decoder","regex-tester","json-formatter"],
  "data-storage-converter": ["timestamp-converter","unit-converter","number-base-converter","image-resizer","video-size-calculator","image-format-converter"],
  "slug-generator": ["case-converter","url-encoder","markdown-to-html","utm-builder","fancy-font-generator"],
  "yaml-to-json": ["regex-tester","json-formatter","json-to-csv"],
  "lorem-ipsum-generator": ["markdown-to-html","word-counter","fancy-font-generator","five-letter-word-finder","word-scramble-solver","random-choice-picker"],
  "text-diff-checker": ["word-counter","markdown-to-html","regex-tester","utm-builder"],
  "uuid-generator": ["jwt-decoder","password-generator","number-base-converter","regex-tester"],
  "jwt-decoder": ["uuid-generator","timestamp-converter","password-generator","hash-generator","regex-tester","number-base-converter"],
  "regex-tester": ["yaml-to-json","text-diff-checker","json-formatter","timestamp-converter","jwt-decoder","uuid-generator"],
  "percentage-calculator": ["unit-converter","aspect-ratio-calculator","image-compressor","fuel-cost-calculator","electricity-bill-calculator"],
  "aspect-ratio-calculator": ["image-resizer","image-compressor","percentage-calculator","ppi-calculator"],
  "utm-builder": ["url-encoder","slug-generator","text-diff-checker"],
  "hash-generator": ["password-generator","jwt-decoder","number-base-converter"],
  "image-resizer": ["aspect-ratio-calculator","image-compressor","color-converter","data-storage-converter","image-format-converter","image-cropper"],
  "remove-duplicate-lines": ["sort-text-lines","find-and-replace-text","character-frequency-counter","readability-score-checker"],
  "sort-text-lines": ["remove-duplicate-lines","find-and-replace-text","character-frequency-counter"],
  "find-and-replace-text": ["remove-duplicate-lines","sort-text-lines","character-frequency-counter","readability-score-checker","text-repeater","line-prefix-suffix"],
  "character-frequency-counter": ["remove-duplicate-lines","sort-text-lines","find-and-replace-text","readability-score-checker","reading-time-calculator","unicode-inspector"],
  "readability-score-checker": ["find-and-replace-text","character-frequency-counter","remove-duplicate-lines"],
  "html-formatter": ["css-formatter","sql-formatter","css-minifier","svg-optimizer"],
  "css-formatter": ["html-formatter","js-minifier","css-minifier","sql-formatter"],
  "css-minifier": ["css-formatter","js-minifier","html-formatter","svg-optimizer"],
  "js-minifier": ["css-minifier","css-formatter","sql-formatter"],
  "sql-formatter": ["js-minifier","html-formatter","css-formatter"],
  "cron-expression-generator": ["pomodoro-timer","open-graph-generator","hmac-generator"],
  "pomodoro-timer": ["cron-expression-generator","bmi-calculator","random-string-generator","compound-interest-calculator","loan-emi-calculator","stopwatch-timer","timezone-converter"],
  "hmac-generator": ["random-string-generator","meta-tag-generator","cron-expression-generator"],
  "random-string-generator": ["hmac-generator","pomodoro-timer","open-graph-generator"],
  "meta-tag-generator": ["open-graph-generator","keyword-density-checker","hmac-generator","robots-txt-generator"],
  "open-graph-generator": ["meta-tag-generator","keyword-density-checker","cron-expression-generator","random-string-generator"],
  "keyword-density-checker": ["meta-tag-generator","open-graph-generator","bmi-calculator"],
  "bmi-calculator": ["keyword-density-checker","pomodoro-timer","compound-interest-calculator","loan-emi-calculator","protein-target-calculator","calorie-deficit-calculator"],
  "compound-interest-calculator": ["loan-emi-calculator","rent-vs-buy-calculator","tdee-calculator","pomodoro-timer","bmi-calculator","savings-goal-calculator","electricity-bill-calculator","gpa-calculator","roi-calculator"],
  "loan-emi-calculator": ["compound-interest-calculator","bmi-calculator","pomodoro-timer","savings-goal-calculator","gpa-calculator"],
  "fancy-font-generator": ["case-converter","slug-generator","five-letter-word-finder","random-choice-picker","lorem-ipsum-generator","reverse-text"],
  "five-letter-word-finder": ["fancy-font-generator","word-counter","word-scramble-solver","lorem-ipsum-generator","reading-time-calculator","recipe-scaler-calculator"],
  "random-choice-picker": ["fancy-font-generator","personality-quiz","password-generator","lorem-ipsum-generator"],
  "word-scramble-solver": ["five-letter-word-finder","lorem-ipsum-generator","personality-quiz","recipe-scaler-calculator"],
  "personality-quiz": ["word-scramble-solver","random-choice-picker","password-generator"],
  "coffee-calories-calculator": ["drink-calories-calculator","meal-calories-calculator","water-intake-calculator","cooking-converter"],
  "drink-calories-calculator": ["coffee-calories-calculator","water-intake-calculator","walking-calories-calculator"],
  "meal-calories-calculator": ["coffee-calories-calculator","protein-target-calculator","recipe-scaler-calculator","cooking-converter"],
  "protein-target-calculator": ["meal-calories-calculator","tdee-calculator","bmi-calculator"],
  "recipe-scaler-calculator": ["meal-calories-calculator","word-scramble-solver","five-letter-word-finder","cooking-converter"],
  "water-intake-calculator": ["coffee-calories-calculator","sleep-cycle-calculator","walking-calories-calculator","calorie-deficit-calculator","drink-calories-calculator","date-countdown-calculator","due-date-calculator"],
  "walking-calories-calculator": ["water-intake-calculator","drink-calories-calculator","calorie-deficit-calculator"],
  "sleep-cycle-calculator": ["water-intake-calculator","date-countdown-calculator","tdee-calculator","age-calculator","stopwatch-timer","due-date-calculator"],
  "date-countdown-calculator": ["sleep-cycle-calculator","reading-time-calculator","water-intake-calculator","age-calculator","due-date-calculator","stopwatch-timer","timezone-converter"],
  "tdee-calculator": ["protein-target-calculator","calorie-deficit-calculator","sleep-cycle-calculator","freelance-rate-calculator","compound-interest-calculator"],
  "calorie-deficit-calculator": ["tdee-calculator","bmi-calculator","water-intake-calculator","walking-calories-calculator"],
  "tip-bill-split-calculator": ["discount-calculator","profit-margin-calculator","freelance-rate-calculator","sales-tax-calculator"],
  "discount-calculator": ["tip-bill-split-calculator","break-even-calculator","profit-margin-calculator","sales-tax-calculator"],
  "profit-margin-calculator": ["tip-bill-split-calculator","discount-calculator","break-even-calculator","freelance-rate-calculator","sales-tax-calculator"],
  "break-even-calculator": ["profit-margin-calculator","freelance-rate-calculator","discount-calculator","rent-vs-buy-calculator","savings-goal-calculator","roi-calculator"],
  "freelance-rate-calculator": ["profit-margin-calculator","break-even-calculator","tdee-calculator","tip-bill-split-calculator","sales-tax-calculator"],
  "reading-time-calculator": ["character-frequency-counter","five-letter-word-finder","date-countdown-calculator","word-counter","age-calculator","stopwatch-timer","text-repeater","reverse-text"],
  "rent-vs-buy-calculator": ["break-even-calculator","compound-interest-calculator","video-size-calculator","savings-goal-calculator"],
  "video-size-calculator": ["data-storage-converter","rent-vs-buy-calculator","image-compressor","fuel-cost-calculator","image-format-converter"],
  "age-calculator": ["date-countdown-calculator","due-date-calculator","sleep-cycle-calculator","reading-time-calculator","timezone-converter"],
  "sales-tax-calculator": ["tip-bill-split-calculator","discount-calculator","profit-margin-calculator","freelance-rate-calculator"],
  "savings-goal-calculator": ["compound-interest-calculator","loan-emi-calculator","break-even-calculator","rent-vs-buy-calculator"],
  "fuel-cost-calculator": ["electricity-bill-calculator","unit-converter","percentage-calculator","video-size-calculator"],
  "cooking-converter": ["recipe-scaler-calculator","unit-converter","coffee-calories-calculator","meal-calories-calculator"],
  "stopwatch-timer": ["pomodoro-timer","date-countdown-calculator","reading-time-calculator","sleep-cycle-calculator"],
  "electricity-bill-calculator": ["fuel-cost-calculator","compound-interest-calculator","unit-converter","percentage-calculator"],
  "due-date-calculator": ["date-countdown-calculator","age-calculator","sleep-cycle-calculator","water-intake-calculator"],
  "text-repeater": ["reverse-text","word-counter","case-converter","find-and-replace-text","line-prefix-suffix"],
  "reverse-text": ["text-repeater","case-converter","word-counter"],
  "image-format-converter": ["image-compressor","image-resizer","data-storage-converter","video-size-calculator"],
  "image-cropper": ["image-resizer","image-format-converter","image-compressor"],
  "image-to-base64": ["base64-encoder","image-format-converter","json-to-csv"],
  "exif-metadata-remover": ["image-compressor","image-format-converter","image-color-picker"],
  "image-color-picker": ["color-converter","image-format-converter","css-gradient-generator"],
  "json-to-typescript": ["json-formatter","json-to-csv","xml-to-json"],
  "svg-optimizer": ["css-minifier","html-formatter","css-gradient-generator"],
  "css-shadow-generator": ["css-gradient-generator","css-formatter","color-converter","css-gradient-generator"],
  "css-gradient-generator": ["css-shadow-generator","color-converter","image-color-picker","css-shadow-generator"],
  "robots-txt-generator": ["meta-tag-generator","open-graph-generator","keyword-density-checker"],
  "chmod-calculator": ["password-generator","uuid-generator","password-strength-checker"],
  "url-parser": ["url-encoder","utm-builder","html-entity-encoder"],
  "password-strength-checker": ["password-generator","bcrypt-generator","aes-text-encryptor"],
  "bcrypt-generator": ["password-strength-checker","hmac-generator","password-generator"],
  "aes-text-encryptor": ["hmac-generator","hash-generator","password-strength-checker"],
  "csv-to-json": ["json-to-csv","xml-to-json","json-formatter"],
  "xml-to-json": ["json-formatter","json-to-typescript","csv-to-json"],
  "html-entity-encoder": ["url-encoder","base64-encoder","unicode-inspector"],
  "roman-numeral-converter": ["number-base-converter","percentage-calculator","unit-converter"],
  "ppi-calculator": ["aspect-ratio-calculator","image-resizer","image-cropper"],
  "unicode-inspector": ["character-frequency-counter","word-counter","html-entity-encoder"],
  "fancy-text-generator": ["case-converter","text-repeater","line-prefix-suffix"],
  "line-prefix-suffix": ["text-repeater","fancy-text-generator","find-and-replace-text"],
  "gpa-calculator": ["roi-calculator","compound-interest-calculator","loan-emi-calculator"],
  "roi-calculator": ["gpa-calculator","break-even-calculator","compound-interest-calculator"],
  "timezone-converter": ["date-countdown-calculator","age-calculator","pomodoro-timer"],
};

/** Matches the contextual %%TOOL%% link written into each tool's About copy. */
const CONTEXTUAL_TOOL: Record<string, string> = {
  "text-diff-checker": "word-counter",
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
  "cron-expression-generator": "pomodoro-timer",
  "pomodoro-timer": "cron-expression-generator",
  "hmac-generator": "random-string-generator",
  "random-string-generator": "hmac-generator",
  "meta-tag-generator": "open-graph-generator",
  "open-graph-generator": "meta-tag-generator",
  "keyword-density-checker": "bmi-calculator",
  "compound-interest-calculator": "loan-emi-calculator",
  "loan-emi-calculator": "compound-interest-calculator",
  "bmi-calculator": "keyword-density-checker",
  "fancy-font-generator": "case-converter",
  "case-converter": "fancy-font-generator",
  "five-letter-word-finder": "word-counter",
  "word-counter": "five-letter-word-finder",
  "word-scramble-solver": "five-letter-word-finder",
  "personality-quiz": "random-choice-picker",
  "random-choice-picker": "password-generator",
  "coffee-calories-calculator": "drink-calories-calculator",
  "meal-calories-calculator": "protein-target-calculator",
  "water-intake-calculator": "walking-calories-calculator",
  "sleep-cycle-calculator": "date-countdown-calculator",
  "tdee-calculator": "protein-target-calculator",
  "protein-target-calculator": "tdee-calculator",
  "tip-bill-split-calculator": "discount-calculator",
  "discount-calculator": "tip-bill-split-calculator",
  "profit-margin-calculator": "break-even-calculator",
  "reading-time-calculator": "word-counter",
  "calorie-deficit-calculator": "tdee-calculator",
  "drink-calories-calculator": "coffee-calories-calculator",
  "walking-calories-calculator": "water-intake-calculator",
  "recipe-scaler-calculator": "meal-calories-calculator",
  "freelance-rate-calculator": "profit-margin-calculator",
  "break-even-calculator": "profit-margin-calculator",
  "rent-vs-buy-calculator": "break-even-calculator",
  "video-size-calculator": "data-storage-converter",
  "date-countdown-calculator": "sleep-cycle-calculator",
  "age-calculator": "date-countdown-calculator",
  "sales-tax-calculator": "tip-bill-split-calculator",
  "savings-goal-calculator": "compound-interest-calculator",
  "fuel-cost-calculator": "electricity-bill-calculator",
  "cooking-converter": "recipe-scaler-calculator",
  "stopwatch-timer": "pomodoro-timer",
  "electricity-bill-calculator": "fuel-cost-calculator",
  "due-date-calculator": "date-countdown-calculator",
  "text-repeater": "reverse-text",
  "reverse-text": "text-repeater",
  "image-format-converter": "image-resizer",
  "image-cropper": "image-resizer",
  "image-to-base64": "base64-encoder",
  "exif-metadata-remover": "image-compressor",
  "image-color-picker": "color-converter",
  "json-to-typescript": "json-formatter",
  "svg-optimizer": "css-minifier",
  "css-shadow-generator": "css-gradient-generator",
  "css-gradient-generator": "css-shadow-generator",
  "robots-txt-generator": "meta-tag-generator",
  "chmod-calculator": "password-generator",
  "url-parser": "url-encoder",
  "password-strength-checker": "password-generator",
  "bcrypt-generator": "password-strength-checker",
  "aes-text-encryptor": "hmac-generator",
  "csv-to-json": "json-to-csv",
  "xml-to-json": "json-formatter",
  "html-entity-encoder": "url-encoder",
  "roman-numeral-converter": "number-base-converter",
  "ppi-calculator": "aspect-ratio-calculator",
  "unicode-inspector": "character-frequency-counter",
  "fancy-text-generator": "case-converter",
  "line-prefix-suffix": "text-repeater",
  "gpa-calculator": "roi-calculator",
  "roi-calculator": "gpa-calculator",
  "timezone-converter": "date-countdown-calculator",
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
