import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { ArrowRight, Mail } from "lucide-react";

type LocalePageProps = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: LocalePageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "contact" });
  return { title: t("title"), description: t("description") };
}

export default async function ContactPage({ params }: LocalePageProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "contact" });

  return (
    <main className="tp-container" style={{ paddingBottom: 64 }}>
      <section className="tp-page-hero">
        <div className="tp-page-hero-grid">
          <div className="tp-page-title">
            <p className="tp-eyebrow">{t("eyebrow")}</p>
            <h1>{t("title")}</h1>
            <p>{t("description")}</p>
          </div>
        </div>
      </section>

      <div className="tp-card" style={{ maxWidth: 720, padding: 28 }}>
        <p className="tp-micro" style={{ marginBottom: 10 }}>{t("emailLabel")}</p>
        <a href="mailto:hello@toolpika.site" className="tp-text-link" style={{ fontSize: 18 }}>
          hello@toolpika.site
          <Mail className="tp-icon" aria-hidden="true" />
        </a>
        <p style={{ marginTop: 20, color: "var(--muted)", fontSize: 15, lineHeight: 1.65 }}>
          {t("responseTime")}
        </p>
      </div>

      <div style={{ marginTop: 32 }}>
        <a href="mailto:hello@toolpika.site" className="tp-text-link">
          Send an email
          <ArrowRight className="tp-icon" aria-hidden="true" />
        </a>
      </div>
    </main>
  );
}
