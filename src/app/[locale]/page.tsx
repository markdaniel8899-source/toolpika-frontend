import type { ComponentType, SVGProps } from "react";
import React from "react";
import { getTranslations } from "next-intl/server";
import { ArrowRight, Check } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { SearchBar } from "@/components/tools/search-bar";
import { ToolCard } from "@/components/tools/tool-card";
import { HeroDemo } from "@/components/hero/HeroDemo";
import { PillCta } from "@/components/ui/pill-cta";
import { categories, getLiveTools, getPopularTools, categoryKey } from "@/lib/tools/registry";
import { Reveal } from "@/components/ui/reveal";
import { cn } from "@/lib/utils";

type LocalePageProps = {
  params: Promise<{ locale: string }>;
};

export default async function HomePage({ params }: LocalePageProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "home" });
  const tTools = await getTranslations({ locale, namespace: "tools" });
  const tools = getLiveTools();
  const featuredTools = getPopularTools(4);

  return (
    <main>
      {/* Hero */}
      <section className="tp-container tp-hero">
        <div className="tp-hero-copy">
          <Reveal delay={120}>
            <p className="tp-eyebrow">{t("eyebrow")}</p>
          </Reveal>
          <Reveal delay={230}>
            <h1 className="tp-hero-title">
              {t.rich("title", {
                display: (chunks: React.ReactNode) => <em>{chunks}</em>,
              })}
            </h1>
          </Reveal>
          <Reveal delay={340}>
            <p className="tp-lede">{t("subtitle")}</p>
          </Reveal>
          <Reveal delay={450} className="tp-search-reveal">
            <SearchBar />
          </Reveal>
          <Reveal delay={560}>
            <div className="tp-trust" aria-label={t("promisesLabel")}>
              <span><Check className="tp-icon" aria-hidden="true" /> {t("promiseNoUploads")}</span>
              <span><Check className="tp-icon" aria-hidden="true" /> {t("promiseNoSignup")}</span>
              <span><Check className="tp-icon" aria-hidden="true" /> {t("promiseFree")}</span>
            </div>
          </Reveal>
        </div>

        <Reveal delay={620}>
          <HeroDemo />
        </Reveal>
      </section>

      {/* Tool grid */}
      <section className="tp-container tp-section" id="tools">
        <div className="tp-section-head" data-reveal-wrap>
          <div>
            <p className="tp-eyebrow">{t("popularEyebrow")}</p>
            <h2 className="tp-section-title tp-section-title-lg">{t("popular")}</h2>
          </div>
          <Link href="/all-tools" className="tp-text-link">
            {t("viewAllTools")}
            <ArrowRight className="tp-icon" aria-hidden="true" />
          </Link>
        </div>

        <div className="tp-tool-grid">
          {featuredTools.map((tool, index) => (
            <Reveal key={tool.slug} delay={index * 90}>
              <ToolCard tool={tool} />
            </Reveal>
          ))}
        </div>
      </section>

      {/* Categories */}
      <section className="tp-container tp-section" id="categories">
        <div className="tp-split">
          <div className="tp-split-copy tp-split-copy-lg">
            <p className="tp-eyebrow">{t("browseEyebrow")}</p>
            <h2 className="tp-section-title tp-section-title-lg">{t("findByCategory")}</h2>
            <p>{t("categoryIntro")}</p>
            <PillCta
              href="/categories"
              size="lg"
              className="tp-category-cta"
              style={{ marginTop: 16 }}
            >
              {t("viewAllCategories")}
            </PillCta>
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
                        <span className="tp-category-name">{tTools(categoryKey(category.slug))}</span>
                        <span className="tp-category-desc">{t(`categoryDescriptions.${category.slug}`)}</span>
                      </span>
                      <span style={{ display: "flex", alignItems: "center", gap: 14 }}>
                        <span className="tp-category-count">
                          {t("categoryCount", { count: categoryTools.length })}
                        </span>
                        <span className="tp-tool-arrow" aria-hidden="true">
                          <ArrowRight className="tp-icon" />
                        </span>
                      </span>
                    </>
                  ) : (
                    <>
                      <span style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
                        <span className="tp-icon-tile">
                          <Icon className="tp-icon" aria-hidden="true" />
                        </span>
                        <span className="tp-tool-arrow" aria-hidden="true">
                          <ArrowRight className="tp-icon" />
                        </span>
                      </span>
                      <span className="tp-category-name">{tTools(categoryKey(category.slug))}</span>
                      <span className="tp-category-desc">{t(`categoryDescriptions.${category.slug}`)}</span>
                      <span className="tp-category-count">
                        {t("categoryCount", { count: categoryTools.length })}
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
            <p className="tp-eyebrow">{t("philosophyEyebrow")}</p>
            <h2 className="tp-philosophy-title">{t("philosophyTitle1")}<br /><em>{t("philosophyTitle2")}</em></h2>
            <p className="tp-philosophy-sub">{t("philosophySub")}</p>
          </Reveal>

          <div className="tp-principle-list">
            <Reveal delay={140}>
              <div className="tp-principle">
                <span className="tp-principle-num">01</span>
                <div>
                  <h3>{t("principle1Title")}</h3>
                  <p>{t("principle1Body")}</p>
                </div>
              </div>
            </Reveal>
            <Reveal delay={250}>
              <div className="tp-principle">
                <span className="tp-principle-num">02</span>
                <div>
                  <h3>{t("principle2Title")}</h3>
                  <p>{t("principle2Body")}</p>
                </div>
              </div>
            </Reveal>
            <Reveal delay={360}>
              <div className="tp-principle">
                <span className="tp-principle-num">03</span>
                <div>
                  <h3>{t("principle3Title")}</h3>
                  <p>{t("principle3Body")}</p>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* Request CTA */}
      <section className="tp-cta-band" id="request">
        <div className="tp-container tp-cta">
          <div className="tp-cta-inner">
          <div>
            <p className="tp-eyebrow">{t("requestEyebrow")}</p>
            <h2>{t("requestTitle")}</h2>
          </div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 36 }}>
              <p style={{ maxWidth: 360, margin: 0, lineHeight: 1.6 }}>
                {t("requestSubtitle")}
              </p>
              <PillCta href="/request">{t("requestCTA")}</PillCta>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
