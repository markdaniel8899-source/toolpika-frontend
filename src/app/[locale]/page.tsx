import type { ComponentType, SVGProps } from "react";
import React from "react";
import { getTranslations } from "next-intl/server";
import { ArrowRight, ArrowUpRight, Check, Shield, Zap } from "lucide-react";
import { Link } from "@/i18n/navigation";
import dynamic from "next/dynamic";
import { SearchBar } from "@/components/tools/search-bar";
import { ToolIcon } from "@/components/tools/tool-icon";
import { CarouselSkeleton } from "@/components/ui/skeleton";
import type { HeroSlide } from "@/components/home/hero-carousel";

const HeroCarousel = dynamic(
  () => import("@/components/home/hero-carousel").then((module) => module.HeroCarousel),
  { loading: () => <CarouselSkeleton /> },
);
import { categories, getLiveTools, getPopularTools, getTool, type ToolCategory } from "@/lib/tools/registry";
import { Reveal } from "@/components/ui/reveal";
import { cn } from "@/lib/utils";

const CATEGORY_LABELS: Record<ToolCategory, string> = {
  text: "Text",
  image: "Images",
  file: "Files",
  code: "Code",
  converter: "Converters",
  security: "Security",
  calculator: "Calculators",
};

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

  const slides: HeroSlide[] = ["word-counter", "json-formatter", "password-generator"]
    .map((slug) => getTool(slug))
    .filter((tool): tool is NonNullable<typeof tool> => Boolean(tool))
    .map((tool) => ({
      slug: tool.slug,
      title: tool.title,
      description: tool.description,
      category: CATEGORY_LABELS[tool.category],
      icon: tool.icon,
    }));

  return (
    <main>
      {/* Hero */}
      <section className="tp-container tp-hero">
        <div className="tp-hero-copy">
          <p className="tp-eyebrow">Free tools, in your browser</p>
          <h1 className="tp-hero-title">
            {t.rich("title", {
              display: (chunks: React.ReactNode) => <em>{chunks}</em>,
            })}
          </h1>
          <p className="tp-lede">{t("subtitle")}</p>

          <SearchBar />

          <div className="tp-trust" aria-label="Toolpika promises">
            <span><Check className="tp-icon" aria-hidden="true" /> No uploads</span>
            <span><Check className="tp-icon" aria-hidden="true" /> No sign-up</span>
            <span><Check className="tp-icon" aria-hidden="true" /> Free to use</span>
          </div>
        </div>

        <HeroCarousel slides={slides} />
      </section>

      {/* Tool grid */}
      <section className="tp-container tp-section" id="tools">
        <div className="tp-section-head">
          <div>
            <p className="tp-eyebrow">Popular</p>
            <h2 className="tp-section-title">Popular tools</h2>
          </div>
          <Link href="/all-tools" className="tp-text-link">
            View all tools
            <ArrowRight className="tp-icon" aria-hidden="true" />
          </Link>
        </div>

        <div className="tp-tool-grid">
          {featuredTools.map((tool, index) => (
            <Reveal key={tool.slug} delay={index * 40}>
              <Link href={`/tools/${tool.slug}`} className="tp-card tp-tool-card">
                <span className="tp-tool-top">
                  <span className="tp-tool-icon">
                    <ToolIcon name={tool.icon} className="tp-icon" aria-hidden="true" />
                  </span>
                  <ArrowUpRight className="tp-icon" style={{ width: 14, height: 14, color: "var(--accent)", opacity: 0.55 }} aria-hidden="true" />
                </span>
                <h3 className="tp-tool-title">{tool.title}</h3>
                <p className="tp-tool-desc">{tool.description}</p>
                <span className="tp-tool-cat">{CATEGORY_LABELS[tool.category]}</span>
              </Link>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Categories */}
      <section className="tp-container tp-section" id="categories">
        <div className="tp-split">
          <div className="tp-split-copy">
            <p className="tp-eyebrow">Browse</p>
            <h2>Find by category</h2>
            <p>
              Small collections, each with one job. Start with the kind of work
              you are doing, not the name of a tool.
            </p>
            <Link href="/all-tools" className="tp-text-link" style={{ marginTop: 26 }}>
              View all tools
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

      {/* Why Toolpika */}
      <section id="about" style={{ background: "var(--surface-2)" }}>
        <div className="tp-container tp-split" style={{ paddingTop: 56, paddingBottom: 56 }}>
          <div className="tp-split-copy">
            <p className="tp-eyebrow">Why Toolpika</p>
            <h2>Small tools. No small print.</h2>
            <p>
              No accounts. No uploads. No clutter. Just useful things that work
              in the tab you already have open.
            </p>
          </div>

          <div className="tp-trust-grid tp-static-cards">
            <div className="tp-card tp-trust-card tp-trust-feature">
              <span className="tp-icon-tile"><Shield className="tp-icon" aria-hidden="true" /></span>
              <div>
                <h3>Runs in your browser</h3>
                <p>Text and files are processed on your device, not on a server.</p>
              </div>
            </div>
            <div className="tp-card tp-trust-card">
              <span className="tp-icon-tile"><Zap className="tp-icon" aria-hidden="true" /></span>
              <h3>Nothing to install</h3>
              <p>Open a tool, do the job, close the tab. No account in between.</p>
            </div>
            <div className="tp-card tp-trust-card">
              <span className="tp-icon-tile"><Check className="tp-icon" aria-hidden="true" /></span>
              <h3>Free to use</h3>
              <p>No paywall, no trial clock, no feature hidden behind a sign-up.</p>
            </div>
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
