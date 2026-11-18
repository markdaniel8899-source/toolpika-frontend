import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { ArrowRight, ShieldCheck, Sparkles, Zap } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { SecondaryPage } from "@/components/layout/secondary-page";
import { Reveal } from "@/components/ui/reveal";

type LocalePageProps = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: LocalePageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "about" });
  return { title: t("title"), description: t("description") };
}

export default async function AboutPage({ params }: LocalePageProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "about" });

  const perks = [
    { icon: ShieldCheck, title: t("privacyTitle"), body: t("privacyBody") },
    { icon: Zap, title: "Instant by default", body: "Every tool opens in a tab and works the moment you load it." },
    { icon: Sparkles, title: "Small by design", body: "One job per tool, so there is nothing to learn before you begin." },
  ];

  return (
    <SecondaryPage wide>
      <Reveal>
        <p className="tp-atlas-eyebrow">{t("eyebrow")}</p>
        <h1 className="tp-atlas-title">About <span className="soft">Toolpika</span></h1>
        <p className="tp-atlas-lead">{t("intro")}</p>
      </Reveal>

      <section className="tp-atlas-section">
        <div className="tp-split">
          <Reveal className="tp-split-copy">
            <p className="tp-atlas-eyebrow">What we believe</p>
            <h2 className="tp-atlas-h2" style={{ marginTop: 16 }}>Useful tools should stay out of the way.</h2>
            <p className="tp-atlas-p">
              No accounts, no uploads and no clutter. Just a quiet collection of utilities
              that do one job well and leave when you are done.
            </p>
            <Link href="/all-tools" className="tp-text-link" style={{ marginTop: 24 }}>
              Browse the collection
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
          <p className="tp-atlas-eyebrow">Our story</p>
          <h2 className="tp-atlas-h2" style={{ marginTop: 16 }}>Built for the small jobs, every day.</h2>
          <p className="tp-atlas-p">
            Toolpika started as a set of private utilities for everyday work. Each one solved
            a single annoyance without asking for a sign-up or sending a file to a server.
          </p>
          <p className="tp-atlas-p">
            That idea still drives the site. Tools stay local, pages stay light and the
            collection grows only when something is genuinely useful.
          </p>
        </Reveal>
      </section>

      <section className="tp-atlas-section">
        <Reveal className="tp-atlas-card" style={{ textAlign: "center" }}>
          <p className="tp-atlas-eyebrow" style={{ justifyContent: "center" }}>{t("contactTitle")}</p>
          <h2 className="tp-atlas-h2" style={{ marginTop: 14 }}>Need something specific?</h2>
          <p className="tp-atlas-p" style={{ maxWidth: 520, marginLeft: "auto", marginRight: "auto" }}>
            Tell us what you need and we will look at it. We read every request.
          </p>
          <Link href="/request" className="tp-btn tp-btn-primary" style={{ marginTop: 24 }}>
            Request a tool
            <ArrowRight className="tp-icon" aria-hidden="true" />
          </Link>
        </Reveal>
      </section>
    </SecondaryPage>
  );
}
