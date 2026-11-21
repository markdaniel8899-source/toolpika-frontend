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
} from "@/lib/tools/registry";
import { getToolSeoContent } from "@/lib/tools/seo-content";

const LOCALES = [
  "en", "de", "fr", "es", "pt-BR", "ru", "tr", "it", "ar", "hi",
] as const;

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
  if (!tool) return { title: "Tool not found" };

  const t = await getTranslations({ locale, namespace: "tools" });
  const siteUrl = getSiteUrl();

  return {
    title: `${tool.title} | ${t("online")}`,
    description: tool.description,
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
      title: `${tool.title} | Toolpika`,
      description: tool.description,
      type: "website",
      url: `${siteUrl}/${locale}/tools/${tool.slug}`,
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

  const categoryLabel = getCategoryLabel(tool.category, t);
  const seo = getToolSeoContent(tool, categoryLabel);

  // 4.7 - same-category tools first; top popular as fallback when < 3.
  const related = getToolsByCategory(tool.category)
    .filter((item) => item.slug !== tool.slug)
    .slice(0, 4);
  if (related.length < 3) {
    const seen = new Set([tool.slug, ...related.map((item) => item.slug)]);
    for (const fallback of getLiveTools()) {
      if (related.length >= 4) break;
      if (!seen.has(fallback.slug)) {
        related.push(fallback);
        seen.add(fallback.slug);
      }
    }
  }

  const siteUrl = getSiteUrl();
  const pageUrl = `${siteUrl}/${locale}/tools/${tool.slug}`;

  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebApplication",
        name: tool.title,
        description: tool.description,
        url: pageUrl,
        applicationCategory: "UtilitiesApplication",
        operatingSystem: "Any",
        browserRequirements: "Requires JavaScript",
        isAccessibleForFree: true,
        inLanguage: locale,
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
          { "@type": "ListItem", position: 3, name: tool.title, item: pageUrl },
        ],
      },
      // 4.6 - FAQPage schema for the fully visible FAQs rendered below.
      {
        "@type": "FAQPage",
        mainEntity: seo.faqs.map((faq) => ({
          "@type": "Question",
          name: faq.question,
          acceptedAnswer: { "@type": "Answer", text: faq.answer },
        })),
      },
    ],
  };

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
          <h1 className="tp-tool-page-title">{tool.title}</h1>
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
        <section className="tp-tool-page-workspace" aria-label={`${tool.title} tool`}>
          <ToolWorkspace slug={tool.slug} />
        </section>

        {/* 4.5 - SEO content as a readable article. Every word of seo.intro
             and seo.sections is rendered verbatim. */}
        <Reveal>
          <section className="tp-content-canvas">
            <div className="tp-content-inner tp-article">
              <h2 className="tp-content-h2">{`About ${tool.title}`}</h2>
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

              <p className="tp-article-copy tp-article-close">
                Everything on this page runs in your browser. Open {tool.title},
                add what you need, and take the result with you. There is no
                setup, no sign-in and nothing to install.
              </p>
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
              Missing a tool? Request it
            </Link>
          </section>
        )}
      </main>
    </>
  );
}
