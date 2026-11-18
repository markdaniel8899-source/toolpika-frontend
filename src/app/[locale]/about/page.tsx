import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { ArrowRight } from "lucide-react";
import { Link } from "@/i18n/navigation";

type LocalePageProps = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: LocalePageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "about" });
  return { title: t("title"), description: t("description") };
}

export default async function AboutPage({ params }: LocalePageProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "about" });

  return (
    <main className="tp-container" style={{ paddingBottom: 64 }}>
      <section className="tp-page-hero">
        <div className="tp-page-hero-grid">
          <div className="tp-page-title">
            <p className="tp-eyebrow">{t("eyebrow")}</p>
            <h1>{t("title")}</h1>
            <p>{t("intro")}</p>
          </div>
        </div>
      </section>

      <div className="tp-trust-grid">
        <div className="tp-card tp-trust-card tp-trust-feature">
          <div>
            <h3>{t("privacyTitle")}</h3>
            <p>{t("privacyBody")}</p>
          </div>
        </div>
        <div className="tp-card tp-trust-card">
          <h3>{t("contactTitle")}</h3>
          <p>
            <a href="mailto:hello@toolpika.site" className="tp-text-link">
              hello@toolpika.site
              <ArrowRight className="tp-icon" aria-hidden="true" />
            </a>
          </p>
        </div>
      </div>

      <div style={{ marginTop: 32 }}>
        <Link href="/request" className="tp-text-link">
          Request a tool
          <ArrowRight className="tp-icon" aria-hidden="true" />
        </Link>
      </div>
    </main>
  );
}
