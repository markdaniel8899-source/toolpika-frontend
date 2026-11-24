import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { HelpCircle, ShieldCheck } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Reveal } from "@/components/ui/reveal";
import { ToolCard } from "@/components/tools/tool-card";
import { getSiteUrl } from "@/lib/site-url";
import { ToolWorkspace } from "@/components/tools/tool-workspace";
import {
  getTool,
  getLiveTools,
  getToolsByCategory,
  toolTitleKey,
  toolDescriptionKey,
  toolSeoTitleKey,
  toolSeoDescriptionKey,
} from "@/lib/tools/registry";
import { getToolSeoContent } from "@/lib/tools/seo-content";
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
  "word-counter": ["case-converter", "base64-encoder", "url-encoder"],
};

/** Matches the contextual link written into each tool's page copy. */
const CONTEXTUAL_TOOL: Record<string, string> = {
  "word-counter": "case-converter",
  "case-converter": "word-counter",
  "image-compressor": "word-counter",
  "json-formatter": "word-counter",
  "unit-converter": "case-converter",
  "password-generator": "case-converter",
  "url-encoder": "case-converter",
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

  return {
    title: pageTitle,
    description: pageDescription,
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
  const toolDescription = t(toolDescriptionKey(tool));
  const pageDescription = t(toolSeoDescriptionKey(tool));
  const categoryLabel = getCategoryLabel(tool.category, t);
  const fullContent = getToolPageContent(t, slug);
  const seo = getToolSeoContent(t, {
    name: toolTitle,
    category: categoryLabel,
    description: toolDescription,
  });
  const faqs = fullContent ? fullContent.faqs : seo.faqs;

  // 4.7 - hand-picked related tools where they exist; same-category tools
  // first otherwise, with top popular as a fallback when fewer than three.
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

  const siteUrl = getSiteUrl();
  const pageUrl = `${siteUrl}/${locale}/tools/${tool.slug}`;

  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${siteUrl}/#organization`,
        name: "Toolpika",
        url: siteUrl,
        logo: `${siteUrl}/favicon.svg`,
      },
      {
        "@type": "WebSite",
        name: "Toolpika",
        url: siteUrl,
        inLanguage: locale,
        publisher: { "@id": `${siteUrl}/#organization` },
      },
      {
        "@type": "WebApplication",
        name: toolTitle,
        description: pageDescription,
        url: pageUrl,
        applicationCategory: "UtilitiesApplication",
        operatingSystem: "Any (web browser)",
        browserRequirements: "Requires a modern web browser",
        isAccessibleForFree: true,
        inLanguage: locale,
        publisher: { "@id": `${siteUrl}/#organization` },
        offers: {
          "@type": "Offer",
          price: "0",
          priceCurrency: "USD",
        },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: t("home"), item: `${siteUrl}/${locale}` },
          { "@type": "ListItem", position: 2, name: categoryLabel, item: `${siteUrl}/${locale}/category/${tool.category}` },
          { "@type": "ListItem", position: 3, name: toolTitle, item: pageUrl },
        ],
      },
      // 4.6 - FAQPage schema for the fully visible FAQs rendered below.
      {
        "@type": "FAQPage",
        mainEntity: faqs.map((faq) => ({
          "@type": "Question",
          name: faq.question,
          acceptedAnswer: { "@type": "Answer", text: faq.answer },
        })),
      },
    ],
  };

  const siteWideSchema = {
    "@context": "https://schema.org",
    "@graph": structuredData["@graph"].slice(0, 2),
  };

  const toolSchemas = fullContent
    ? buildToolSchemas({
        locale,
        siteUrl,
        title: toolTitle,
        slug: tool.slug,
        category: tool.category,
        categoryLabel,
        homeLabel: t("home"),
        description: pageDescription,
        content: fullContent,
      })
    : [];

  if (fullContent) {
    return (
      <>
        {[siteWideSchema, ...toolSchemas].map((schema, index) => (
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
          aboutLinkLabel={t("aboutLink")}
          inputLabel={t("input")}
          outputLabel={t("result")}
          workspaceLabel={t("workspaceLabel", { title: toolTitle })}
          contextualTool={contextualTool}
          onThisPageLabel={t("onThisPage")}
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

  const steps = [tHow("step1"), tHow("step2"), tHow("step3")];

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(structuredData).replace(/</g, "\\u003c"),
        }}
      />
      <main className="tp-container tp-tool-page" style={{ paddingBottom: 64 }}>
        {/* 4.1 - Tool name first, H1. */}
        <header className="tp-tool-page-head">
          <h1 className="tp-tool-page-title">{toolTitle}</h1>
          <p className="tp-tool-page-sub">
            <ShieldCheck className="tp-icon" aria-hidden="true" />
            {t("runsInBrowser")}
          </p>
        </header>

        {/* 4.2 - How to use heading. */}
        <h2 className="tp-tool-page-section-title">{tHow("howToTitle")}</h2>

        {/* 4.3 - Numbered steps with accent circles. */}
        <ol className="tp-how-list">
          {steps.map((step, index) => (
            <li key={index} className="tp-how-item">
              <span className="tp-how-number" aria-hidden="true">{index + 1}</span>
              <p>{step}</p>
            </li>
          ))}
        </ol>

        {/* 4.4 - The actual tool workspace, below the steps. */}
        <section className="tp-tool-page-workspace" aria-label={t("workspaceLabel", { title: toolTitle })}>
          <ToolWorkspace slug={tool.slug} />
        </section>

        {/* 4.5 - SEO content as a readable article. Every word of seo.intro
             and seo.sections is rendered verbatim. */}
        <Reveal>
          <section className="tp-content-canvas">
            <div className="tp-content-inner tp-article">
              <h2 className="tp-content-h2">{t("about", { title: toolTitle })}</h2>
              <p className="tp-content-lead">{seo.intro}</p>

              {seo.sections.map((section) => (
                <div key={section.heading} className="tp-article-block">
                  <h3 className="tp-article-h3">{section.heading}</h3>
                  {section.paragraphs.map((paragraph) => (
                    <p key={paragraph} className="tp-article-copy">
                      {paragraph}
                    </p>
                  ))}
                </div>
              ))}

              <p className="tp-article-copy tp-article-close">{seo.closing}</p>
            </div>
          </section>
        </Reveal>

        {/* 4.6 - FAQs stay fully open for SEO, in a single vertical column. */}
        <Reveal delay={80}>
          <section className="tp-faq-canvas">
            <div className="tp-content-inner tp-article">
              <h2 className="tp-content-h2">{tHow("faqTitle")}</h2>
              <div className="tp-faq-list">
                {seo.faqs.map((faq, index) => (
                  <Reveal key={faq.question} stagger index={index}>
                    <article className="tp-faq-row">
                      <span className="tp-faq-icon">
                        <HelpCircle className="tp-icon" aria-hidden="true" />
                      </span>
                      <div>
                        <h3 className="tp-faq-q">{faq.question}</h3>
                        <p className="tp-faq-a">{faq.answer}</p>
                      </div>
                    </article>
                  </Reveal>
                ))}
              </div>
            </div>
          </section>
        </Reveal>

        {/* 4.7 - Related tools, last on the page. */}
        {related.length > 0 && (
          <section className="tp-tool-related">
            <h2 className="tp-tool-page-section-title">{tHow("relatedTitle")}</h2>
            <div className="tp-tool-grid tp-tool-related-grid">
              {related.map((item) => (
                <ToolCard key={item.slug} tool={item} />
              ))}
            </div>
            <Link href="/request" className="tp-text-link tp-tool-related-link">
              {tHow("missingRequest")}
            </Link>
          </section>
        )}
      </main>
    </>
  );
}
