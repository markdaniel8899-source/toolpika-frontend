import type { ComponentType, SVGProps } from "react";
import React from "react";
import { getTranslations } from "next-intl/server";
import { ArrowRight, ArrowUpRight, Check } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { SearchBar } from "@/components/tools/search-bar";
import { ToolCard } from "@/components/tools/tool-card";
import { HeroWorkbench } from "@/components/home/hero-workbench";
import { categories, getLiveTools, getPopularTools } from "@/lib/tools/registry";
import { Reveal } from "@/components/ui/reveal";
import { cn } from "@/lib/utils";

const CATEGORY_DESCRIPTIONS: Record<string, string> = {
  text: "Count, convert and clean up copy.",
  image: "Compress and prepare images locally.",
  code: "Format, validate and inspect code.",
  converter: "Move between units, URLs and Base64.",
  security: "Generate passwords that hold up.",
};

type LocalePageProps = {
  params: Promise<{ locale: string }>;
};

export default async function HomePage({ params }: LocalePageProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "home" });
  const tools = getLiveTools();
  const featuredTools = getPopularTools(4);

  return (
    <main>
      {/* Hero */}
      <section className="tp-container tp-hero">
        <div className="tp-hero-copy">
          <Reveal delay={0}>
            <p className="tp-eyebrow">Free tools, in your browser</p>
          </Reveal>
          <Reveal delay={70}>
            <h1 className="tp-hero-title">
              {t.rich("title", {
                display: (chunks: React.ReactNode) => <em>{chunks}</em>,
              })}
            </h1>
          </Reveal>
          <Reveal delay={140}>
            <p className="tp-lede">{t("subtitle")}</p>
          </Reveal>
          <Reveal delay={210}>
            <SearchBar />
          </Reveal>
          <Reveal delay={270}>
            <div className="tp-trust" aria-label="Toolpika promises">
              <span><Check className="tp-icon" aria-hidden="true" /> No uploads</span>
              <span><Check className="tp-icon" aria-hidden="true" /> No sign-up</span>
              <span><Check className="tp-icon" aria-hidden="true" /> Free to use</span>
            </div>
          </Reveal>
        </div>

        <Reveal delay={160}>
          <HeroWorkbench />
        </Reveal>
      </section>

      {/* Tool grid */}
      <section className="tp-container tp-section" id="tools">
        <div className="tp-section-head" data-reveal-wrap>
          <div>
            <p className="tp-eyebrow">Popular</p>
            <h2 className="tp-section-title tp-section-title-lg">Popular tools</h2>
          </div>
          <Link href="/all-tools" className="tp-text-link">
            View all tools
            <ArrowRight className="tp-icon" aria-hidden="true" />
          </Link>
        </div>

        <div className="tp-tool-grid">
          {featuredTools.map((tool, index) => (
            <Reveal key={tool.slug} delay={index * 40}>
              <ToolCard tool={tool} />
            </Reveal>
          ))}
        </div>
      </section>

      {/* Categories */}
      <section className="tp-container tp-section" id="categories">
        <div className="tp-split">
          <div className="tp-split-copy tp-split-copy-lg">
            <p className="tp-eyebrow">Browse</p>
            <h2 className="tp-section-title tp-section-title-lg">Find by category</h2>
            <p>
              Small collections, each with one job. Start with the kind of work
              you are doing, not the name of a tool.
            </p>
            <Link href="/categories" className="tp-text-link" style={{ marginTop: 26 }}>
              View all categories
              <ArrowRight className="tp-icon" aria-hidden="true" />
            </Link>
          </div>

          <div className="tp-category-grid">
            {categories.map((category, index) => {
              const categoryTools = tools.filter((tool) => tool.category === category.slug);
              const Icon = category.Icon as ComponentType<SVGProps<SVGSVGElement>>;
              return (
                <Link
                  key={category.slug}
                  href={`/category/${category.slug}`}
                  className={cn("tp-card tp-category-card", index === 0 && "tp-category-feature")}
                >
                  {index === 0 ? (
                    <>
                      <span className="tp-icon-tile">
                        <Icon className="tp-icon" aria-hidden="true" />
                      </span>
                      <span style={{ display: "flex", minWidth: 0, flexDirection: "column" }}>
                        <span className="tp-category-name">{category.label}</span>
                        <span className="tp-category-desc">{CATEGORY_DESCRIPTIONS[category.slug]}</span>
                      </span>
                      <span style={{ display: "flex", alignItems: "center", gap: 14 }}>
                        <span className="tp-category-count">
                          {categoryTools.length} {categoryTools.length === 1 ? "tool" : "tools"}
                        </span>
                        <ArrowRight className="tp-icon" style={{ width: 14, height: 14, color: "var(--accent)", opacity: 0.55 }} aria-hidden="true" />
                      </span>
                    </>
                  ) : (
                    <>
                      <span style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
                        <span className="tp-icon-tile">
                          <Icon className="tp-icon" aria-hidden="true" />
                        </span>
                        <ArrowUpRight className="tp-icon" style={{ width: 14, height: 14, color: "var(--accent)", opacity: 0.55 }} aria-hidden="true" />
                      </span>
                      <span className="tp-category-name">{category.label}</span>
                      <span className="tp-category-desc">{CATEGORY_DESCRIPTIONS[category.slug]}</span>
                      <span className="tp-category-count">
                        {categoryTools.length} {categoryTools.length === 1 ? "tool" : "tools"}
                      </span>
                    </>
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* Philosophy — dark in both themes */}
      <section className="tp-philosophy" id="about">
        <div className="tp-container tp-philosophy-grid">
          <Reveal>
            <p className="tp-eyebrow">The philosophy</p>
            <h2 className="tp-philosophy-title">A quieter<br />kind of <em>software.</em></h2>
            <p className="tp-philosophy-sub">
              No accounts. No uploads. No clutter. Just useful things that work
              in the tab you already have open.
            </p>
          </Reveal>

          <div className="tp-principle-list">
            <Reveal delay={40}>
              <div className="tp-principle">
                <span className="tp-principle-num">01</span>
                <div>
                  <h3>On your device</h3>
                  <p>Text and files are processed in your browser. Nothing is uploaded, stored or sent anywhere.</p>
                </div>
              </div>
            </Reveal>
            <Reveal delay={110}>
              <div className="tp-principle">
                <span className="tp-principle-num">02</span>
                <div>
                  <h3>Zero friction</h3>
                  <p>Open a tool, do the job, close the tab. No account to create, no onboarding to sit through.</p>
                </div>
              </div>
            </Reveal>
            <Reveal delay={180}>
              <div className="tp-principle">
                <span className="tp-principle-num">03</span>
                <div>
                  <h3>Built to last</h3>
                  <p>Plain, fast, dependable pages that keep working — no matter how the web changes around them.</p>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* Request CTA */}
      <section className="tp-container tp-cta" id="request">
        <div className="tp-cta-inner">
          <div>
            <p className="tp-eyebrow">Request</p>
            <h2>{t("requestTitle")}</h2>
          </div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 36 }}>
            <p style={{ maxWidth: 320, margin: 0, color: "var(--muted)", fontSize: 15, lineHeight: 1.65 }}>
              {t("requestSubtitle")}
            </p>
            <Link href="/request" className="tp-btn tp-btn-primary">
              {t("requestCTA")}
              <ArrowRight className="tp-icon" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
