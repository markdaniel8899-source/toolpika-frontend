import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { ArrowRight, Flame, Sparkles, BookOpen } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { SearchBar } from "@/components/tools/search-bar";
import { ToolCard } from "@/components/tools/tool-card";
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

      <div style={{ maxWidth: 620, marginBottom: 16 }}>
        <SearchBar />
      </div>

      <div className="tp-tabs" aria-label="Categories">
        <Link href="/all-tools" className="tp-tab" data-active="true">All tools</Link>
        {categories.map((category) => (
          <Link key={category.slug} href={`/category/${category.slug}`} className="tp-tab">
            {category.label}
          </Link>
        ))}
      </div>

      <div className="tp-suggestions" aria-label="Suggestions">
        <Link href="/popular" className="tp-suggestion">
          <span className="tp-suggestion-pill">
            <Flame className="tp-icon" style={{ width: 14, height: 14, color: "var(--accent)" }} aria-hidden="true" />
            Popular
          </span>
          <p>Tools people come back to most.</p>
        </Link>
        <Link href="/new" className="tp-suggestion">
          <span className="tp-suggestion-pill">
            <Sparkles className="tp-icon" style={{ width: 14, height: 14, color: "var(--accent)" }} aria-hidden="true" />
            New
          </span>
          <p>The latest additions to the collection.</p>
        </Link>
        <Link href="/guides" className="tp-suggestion">
          <span className="tp-suggestion-pill">
            <BookOpen className="tp-icon" style={{ width: 14, height: 14, color: "var(--accent)" }} aria-hidden="true" />
            Guides
          </span>
          <p>Short, practical walkthroughs.</p>
        </Link>
      </div>

      <div className="tp-tool-grid">
        {tools.map((tool) => (
          <ToolCard key={tool.slug} tool={tool} />
        ))}
      </div>

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
        <Link href="/request" className="tp-text-link">
          Missing a tool? Request it
          <ArrowRight className="tp-icon" aria-hidden="true" />
        </Link>
      </div>
    </main>
  );
}
