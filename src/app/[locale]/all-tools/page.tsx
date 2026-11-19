import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { ArrowRight } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { SearchBar } from "@/components/tools/search-bar";
import { ToolCard } from "@/components/tools/tool-card";
import { AllToolsBrowser } from "@/components/tools/all-tools-browser";
import { categories, getLiveTools } from "@/lib/tools/registry";

type LocalePageProps = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: LocalePageProps): Promise<Metadata> {
  const { locale } = await params;
  const nav = await getTranslations({ locale, namespace: "nav" });
  const home = await getTranslations({ locale, namespace: "home" });
  return { title: nav("tools"), description: home("subtitle") };
}

export default async function AllToolsPage({ params }: LocalePageProps) {
  const { locale } = await params;
  const nav = await getTranslations({ locale, namespace: "nav" });
  const home = await getTranslations({ locale, namespace: "home" });
  const tools = getLiveTools();

  const featured = ["word-counter", "json-formatter", "password-generator"]
    .map((slug) => tools.find((tool) => tool.slug === slug))
    .filter((tool): tool is NonNullable<typeof tool> => Boolean(tool));

  return (
    <main className="tp-container" style={{ paddingBottom: 64 }}>
      <section className="tp-page-hero">
        <div className="tp-page-hero-grid">
          <div className="tp-page-title">
            <p className="tp-eyebrow">The collection</p>
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
          label: category.label,
        }))}
      />

      {featured.length > 0 && (
        <section style={{ marginTop: 56 }}>
          <div className="tp-section-head">
            <div>
              <p className="tp-eyebrow">Tool spotlight</p>
              <h2 className="tp-section-title">Good places to start</h2>
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
        <Link href="/request" className="tp-btn tp-btn-primary">
          Missing a tool? Request it
          <ArrowRight className="tp-icon" aria-hidden="true" />
        </Link>
      </div>
    </main>
  );
}
