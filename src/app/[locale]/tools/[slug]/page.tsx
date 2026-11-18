import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { ArrowRight, ShieldCheck } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { ToolCard } from "@/components/tools/tool-card";
import { Reveal } from "@/components/ui/reveal";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { ToolWorkspace } from "@/components/tools/tool-workspace";
import { TrackToolView } from "@/components/tools/track-tool-view";
import { getTool, getLiveTools, getToolsByCategory } from "@/lib/tools/registry";

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
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://toolpika.site";

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

export default async function ToolPage({ params }: LocalePageProps) {
  const { slug, locale } = await params;
  const tool = getTool(slug);
  if (!tool) notFound();

  const t = await getTranslations({ locale, namespace: "tools" });
  const tHow = await getTranslations({ locale, namespace: "toolPage" });

  const categoryLabel = (() => {
    const map: Record<string, string> = {
      text: t("catText"),
      image: t("catImage"),
      code: t("catCode"),
      converter: t("catConverter"),
      security: t("catSecurity"),
    };
    return map[tool.category] ?? tool.category;
  })();

  const related = getToolsByCategory(tool.category)
    .filter((item) => item.slug !== tool.slug)
    .slice(0, 4);

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://toolpika.site";
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
    ],
  };

  return (
    <>
      <TrackToolView slug={tool.slug} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(structuredData).replace(/</g, "\\u003c"),
        }}
      />
      <main className="tp-container" style={{ paddingBottom: 64 }}>
        <div style={{ paddingTop: 32, paddingBottom: 28 }}>
          <Breadcrumbs
            items={[
              { label: t("home"), href: "/" },
              { label: categoryLabel, href: `/category/${tool.category}` },
              { label: tool.title },
            ]}
          />
        </div>

        <section className="tp-page-hero" style={{ paddingTop: 0 }}>
          <div className="tp-page-hero-grid">
            <div className="tp-page-title">
              <p className="tp-eyebrow">{categoryLabel}</p>
              <h1>{tool.title}</h1>
              <p>{tool.description}</p>
            </div>
            <span className="tp-page-badge" style={{ display: "inline-flex", alignItems: "center", gap: 7, color: "var(--muted)", fontSize: 12.5 }}>
              <ShieldCheck className="tp-icon" style={{ width: 14, height: 14, color: "var(--accent)" }} aria-hidden="true" />
              {t("runsInBrowser")}
            </span>
          </div>
        </section>

        <Reveal>
          <ToolWorkspace slug={tool.slug} />
        </Reveal>

        {/* SEO content */}
        <div className="tp-split" style={{ marginTop: 56, paddingTop: 56, paddingBottom: 56 }}>
          <div className="tp-split-copy">
            <p className="tp-eyebrow">How it works</p>
            <h2>No setup required</h2>
            <p>Everything happens in this tab. There is nothing to install and nothing to upload.</p>
          </div>

          <div>
            <div className="tp-card" style={{ padding: 24 }}>
              <h3 style={{ margin: "0 0 18px", fontSize: 24, fontWeight: 600, letterSpacing: "-0.03em" }}>
                {tHow("howToTitle")}
              </h3>
              <div>
                {[1, 2, 3].map((step) => (
                  <div key={step} className="tp-step">
                    <p>{tHow(`step${step}`)}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="tp-card" style={{ padding: 24, marginTop: 16 }}>
              <h3 style={{ margin: "0 0 18px", fontSize: 24, fontWeight: 600, letterSpacing: "-0.03em" }}>
                {tHow("faqTitle")}
              </h3>
              <Accordion type="single" collapsible>
                {[1, 2, 3].map((item) => (
                  <AccordionItem key={item} value={`faq-${item}`}>
                    <AccordionTrigger className="tp-faq-q">{tHow(`faqQuestion${item}`)}</AccordionTrigger>
                    <AccordionContent>
                      <p className="tp-faq-a">{tHow(`faqAnswer${item}`)}</p>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          </div>
        </div>

        {related.length > 0 && (
          <section style={{ paddingTop: 40, paddingBottom: 56 }}>
            <div className="tp-section-head">
              <div>
                <p className="tp-eyebrow">Keep going</p>
                <h2 className="tp-section-title">{tHow("relatedTitle")}</h2>
              </div>
            </div>
            <div className="tp-tool-grid" style={{ gridTemplateColumns: "repeat(3, minmax(0, 1fr))" }}>
              {related.map((item) => (
                <ToolCard key={item.slug} tool={item} />
              ))}
            </div>
          </section>
        )}

        <section style={{ paddingBottom: 56 }}>
          <div className="tp-card" style={{ padding: 24 }}>
            <h2 style={{ margin: "0 0 12px", fontSize: 24, fontWeight: 600, letterSpacing: "-0.03em" }}>
              {t("about", { title: tool.title })}
            </h2>
            <p style={{ margin: 0, color: "var(--muted)", fontSize: 14.5 }}>{tool.description}</p>
            <Link href="/request" className="tp-text-link" style={{ marginTop: 20 }}>
              Request another tool
              <ArrowRight className="tp-icon" aria-hidden="true" />
            </Link>
          </div>
        </section>
      </main>
    </>
  );
}
