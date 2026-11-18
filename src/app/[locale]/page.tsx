import React from "react";
import { getTranslations } from "next-intl/server";
import { ArrowRight, Check, Shield, Zap } from "lucide-react";
import { Link } from "@/i18n/navigation";
import dynamic from "next/dynamic";
import { SearchBar } from "@/components/tools/search-bar";
import { RecentTools } from "@/components/tools/recent-tools";
import { CarouselSkeleton } from "@/components/ui/skeleton";
import type { HeroSlide } from "@/components/home/hero-carousel";
import { HomeBento } from "@/components/home/home-bento";
import { getTool, type ToolCategory } from "@/lib/tools/registry";

const HeroCarousel = dynamic(
  () => import("@/components/home/hero-carousel").then((module) => module.HeroCarousel),
  { loading: () => <CarouselSkeleton /> },
);

const CATEGORY_LABELS: Record<ToolCategory, string> = {
  text: "Text",
  image: "Images",
  file: "Files",
  code: "Code",
  converter: "Converters",
  security: "Security",
  calculator: "Calculators",
};

type LocalePageProps = {
  params: Promise<{ locale: string }>;
};

export default async function HomePage({ params }: LocalePageProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "home" });

  const slides: HeroSlide[] = ["word-counter", "case-converter", "password-generator"]
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

      <RecentTools />

      <HomeBento />

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

          <div className="tp-why-list">
            <div className="tp-why-row">
              <span className="tp-icon-tile"><Shield className="tp-icon" aria-hidden="true" /></span>
              <div>
                <h3>Runs in your browser</h3>
                <p>Text and files are processed on your device, not on a server.</p>
              </div>
            </div>
            <div className="tp-why-row">
              <span className="tp-icon-tile"><Zap className="tp-icon" aria-hidden="true" /></span>
              <div>
                <h3>Nothing to install</h3>
                <p>Open a tool, do the job, close the tab. No account in between.</p>
              </div>
            </div>
            <div className="tp-why-row">
              <span className="tp-icon-tile"><Check className="tp-icon" aria-hidden="true" /></span>
              <div>
                <h3>Free to use</h3>
                <p>No paywall, no trial clock, no feature hidden behind a sign-up.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="tp-container tp-cta" id="request">
        <div className="tp-cta-card">
          <div>
            <p className="tp-eyebrow">Request</p>
            <h2>{t("requestTitle")}</h2>
          </div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 36 }}>
            <p style={{ maxWidth: 340, margin: 0, fontSize: 15, lineHeight: 1.65, color: "rgba(255,255,255,0.82)" }}>
              {t("requestSubtitle")}
            </p>
            <Link href="/request" className="tp-btn tp-btn-on-accent">
              {t("requestCTA")}
              <ArrowRight className="tp-icon" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
