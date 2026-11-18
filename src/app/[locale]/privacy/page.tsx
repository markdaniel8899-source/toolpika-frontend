import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

type LocalePageProps = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: LocalePageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "privacy" });
  return { title: t("title"), description: t("description") };
}

export default async function PrivacyPage({ params }: LocalePageProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "privacy" });

  const sections = [
    { title: t("filesTitle"), body: t("filesBody") },
    { title: t("dataTitle"), body: t("dataBody") },
    { title: t("cookiesTitle"), body: t("cookiesBody") },
  ];

  return (
    <main className="tp-container" style={{ paddingBottom: 64 }}>
      <section className="tp-page-hero">
        <div className="tp-page-hero-grid">
          <div className="tp-page-title">
            <p className="tp-eyebrow">{t("eyebrow")}</p>
            <h1>{t("title")}</h1>
            <p>{t("updated")}</p>
          </div>
        </div>
      </section>

      <div className="tp-trust-grid">
        {sections.map((section, index) => (
          <div
            key={section.title}
            className={`tp-card tp-trust-card${index === 0 ? " tp-trust-feature" : ""}`}
          >
            <div>
              <h3>{section.title}</h3>
              <p>{section.body}</p>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
