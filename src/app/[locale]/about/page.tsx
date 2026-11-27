import type { Metadata } from "next";
import { localizedAlternates } from "@/lib/seo/alternates";
import { getTranslations } from "next-intl/server";
import { ArrowRight, ShieldCheck, Sparkles, Zap } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { SecondaryPage } from "@/components/layout/secondary-page";
import { PillCta } from "@/components/ui/pill-cta";
import { Reveal } from "@/components/ui/reveal";
import { JsonLdScripts } from "@/components/seo/json-ld";
import { buildWebPageSchemas } from "@/lib/seo/json-ld";
import { getSiteUrl } from "@/lib/site-url";

type LocalePageProps = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: LocalePageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "about" });
  return {
    title: t("title"),
    description: t("description"),
    alternates: localizedAlternates(locale, "/about"),
  };
}

export default async function AboutPage({ params }: LocalePageProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "about" });
  const schemas = buildWebPageSchemas({
    locale,
    siteUrl: getSiteUrl(),
    path: "/about",
    name: t("title"),
    description: t("description"),
  });

  const perks = [
    { icon: ShieldCheck, title: t("privacyTitle"), body: t("privacyBody") },
    { icon: Zap, title: t("perkInstantTitle"), body: t("perkInstantBody") },
    { icon: Sparkles, title: t("perkSmallTitle"), body: t("perkSmallBody") },
  ];

  return (
    <SecondaryPage wide>
      <JsonLdScripts schemas={schemas} />
      <Reveal>
        <p className="tp-atlas-eyebrow">{t("eyebrow")}</p>
        <h1 className="tp-atlas-title">{t("headingPrefix")} <span className="soft">Toolpika</span></h1>
        <p className="tp-atlas-lead">{t("intro")}</p>
      </Reveal>

      <section className="tp-atlas-section">
        <div className="tp-split">
          <Reveal className="tp-split-copy">
            <p className="tp-atlas-eyebrow">{t("believeEyebrow")}</p>
            <h2 className="tp-atlas-h2" style={{ marginTop: 16 }}>{t("believeTitle")}</h2>
            <p className="tp-atlas-p">{t("believeBody")}</p>
            <Link href="/all-tools" className="tp-text-link" style={{ marginTop: 24 }}>
              {t("browseCollection")}
              <ArrowRight className="tp-icon" aria-hidden="true" />
            </Link>
          </Reveal>

          <Reveal className="tp-atlas-grid" delay={80}>
            {perks.map((perk) => (
              <div key={perk.title} className="tp-atlas-tile">
                <perk.icon className="tp-icon" style={{ color: "var(--accent)", width: 20, height: 20 }} aria-hidden="true" />
                <h3 style={{ marginTop: 14 }}>{perk.title}</h3>
                <p>{perk.body}</p>
              </div>
            ))}
          </Reveal>
        </div>
      </section>

      <section className="tp-atlas-section">
        <Reveal>
          <p className="tp-atlas-eyebrow">{t("storyEyebrow")}</p>
          <h2 className="tp-atlas-h2" style={{ marginTop: 16 }}>{t("storyTitle")}</h2>
          <p className="tp-atlas-p">{t("storyBody1")}</p>
          <p className="tp-atlas-p">{t("storyBody2")}</p>
        </Reveal>
      </section>

      <section className="tp-atlas-section">
        <Reveal className="tp-atlas-card" style={{ textAlign: "center" }}>
          <p className="tp-atlas-eyebrow" style={{ justifyContent: "center" }}>{t("contactTitle")}</p>
          <h2 className="tp-atlas-h2" style={{ marginTop: 14 }}>{t("specificTitle")}</h2>
          <p className="tp-atlas-p" style={{ maxWidth: 520, marginLeft: "auto", marginRight: "auto" }}>
            {t("specificBody")}
          </p>
          <PillCta href="/request" style={{ marginTop: 24 }}>
            {t("requestCta")}
          </PillCta>
        </Reveal>
      </section>
    </SecondaryPage>
  );
}
