import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { ArrowRight } from "lucide-react";
import { Link } from "@/i18n/navigation";

type LocalePageProps = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: LocalePageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "guides" });
  return { title: t("title"), description: t("description") };
}

export default async function GuidesPage({ params }: LocalePageProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "guides" });

  return (
    <main className="tp-container" style={{ paddingBottom: 64 }}>
      <section className="tp-page-hero">
        <div className="tp-page-hero-grid">
          <div className="tp-page-title">
            <p className="tp-eyebrow">{t("eyebrow")}</p>
            <h1>{t("title")}</h1>
            <p>{t("description")}</p>
          </div>
          <span className="tp-page-count">LEARN · PRACTICAL · SHORT</span>
        </div>
      </section>

      <div className="tp-card" style={{ maxWidth: 720, padding: 28 }}>
        <p style={{ margin: 0, color: "var(--muted)", fontSize: 15, lineHeight: 1.65 }}>
          {t("empty")}
        </p>
        <Link href="/request" className="tp-text-link" style={{ marginTop: 20 }}>
          {t("requestInstead")}
          <ArrowRight className="tp-icon" aria-hidden="true" />
        </Link>
      </div>
    </main>
  );
}
