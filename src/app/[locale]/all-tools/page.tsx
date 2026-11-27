import type { Metadata } from "next";
import { localizedAlternates } from "@/lib/seo/alternates";
import { getTranslations } from "next-intl/server";
import { SearchBar } from "@/components/tools/search-bar";
import { ToolCard } from "@/components/tools/tool-card";
import { AllToolsBrowser } from "@/components/tools/all-tools-browser";
import { PillCta } from "@/components/ui/pill-cta";
import {
  categories,
  getLiveTools,
  categoryKey,
  toolTitleKey,
} from "@/lib/tools/registry";
import { JsonLdScripts } from "@/components/seo/json-ld";
import { buildToolListSchemas } from "@/lib/seo/json-ld";
import { getSiteUrl } from "@/lib/site-url";

type LocalePageProps = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: LocalePageProps): Promise<Metadata> {
  const { locale } = await params;
  const nav = await getTranslations({ locale, namespace: "nav" });
  const home = await getTranslations({ locale, namespace: "home" });
  return {
    title: nav("tools"),
    description: home("subtitle"),
    alternates: localizedAlternates(locale, "/all-tools"),
  };
}

export default async function AllToolsPage({ params }: LocalePageProps) {
  const { locale } = await params;
  const nav = await getTranslations({ locale, namespace: "nav" });
  const home = await getTranslations({ locale, namespace: "home" });
  const allTools = await getTranslations({ locale, namespace: "allTools" });
  const tTools = await getTranslations({ locale, namespace: "tools" });
  const tools = getLiveTools();
  const siteUrl = getSiteUrl();
  const schemas = buildToolListSchemas({
    locale,
    siteUrl,
    path: "/all-tools",
    name: nav("tools"),
    description: home("subtitle"),
    items: tools.map((tool) => ({
      name: tTools(toolTitleKey(tool)),
      url: `${siteUrl}/${locale}/tools/${tool.slug}`,
    })),
  });

  const featured = ["word-counter", "json-formatter", "password-generator"]
    .map((slug) => tools.find((tool) => tool.slug === slug))
    .filter((tool): tool is NonNullable<typeof tool> => Boolean(tool));

  return (
    <main className="tp-container" style={{ paddingBottom: 64 }}>
      <JsonLdScripts schemas={schemas} />
      <section className="tp-page-hero">
        <div className="tp-page-hero-grid">
          <div className="tp-page-title">
            <p className="tp-eyebrow">{allTools("eyebrow")}</p>
            <h1>{nav("tools")}</h1>
            <p>{home("subtitle")}</p>
          </div>
          <span className="tp-page-count">FREE · LOCAL · PRIVATE</span>
        </div>
      </section>

      <div style={{ maxWidth: 680, margin: "0 auto 16px" }}>
        <SearchBar />
      </div>

      <AllToolsBrowser
        tools={tools}
        categories={categories.map((category) => ({
          slug: category.slug,
          label: tTools(categoryKey(category.slug)),
        }))}
      />

      {featured.length > 0 && (
        <section style={{ marginTop: 56 }}>
          <div className="tp-section-head">
            <div>
              <p className="tp-eyebrow">{allTools("spotlightEyebrow")}</p>
              <h2 className="tp-section-title">{allTools("spotlightTitle")}</h2>
            </div>
          </div>
          <div className="tp-tool-grid" style={{ gridTemplateColumns: "repeat(3, minmax(0, 1fr))" }}>
            {featured.map((tool) => (
              <ToolCard key={tool.slug} tool={tool} />
            ))}
          </div>
        </section>
      )}

      <div style={{ marginTop: 40 }}>
        <PillCta href="/request">{allTools("requestLink")}</PillCta>
      </div>
    </main>
  );
}
