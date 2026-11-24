import type { Metadata } from "next";
import { localizedAlternates } from "@/lib/seo/alternates";
import { getTranslations } from "next-intl/server";
import { SecondaryPage } from "@/components/layout/secondary-page";
import { Reveal } from "@/components/ui/reveal";

type LocalePageProps = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: LocalePageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "privacy" });
  return {
    title: t("title"),
    description: t("description"),
    alternates: localizedAlternates(locale, "/privacy"),
  };
}

export default async function PrivacyPage({ params }: LocalePageProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "privacy" });

  return (
    <SecondaryPage>
      <Reveal>
        <p className="tp-atlas-eyebrow">{t("eyebrow")}</p>
        <h1 className="tp-atlas-title">{t("title")}</h1>
        <p className="tp-atlas-date">{t("updated")}</p>
        <p className="tp-atlas-lead">{t("description")}</p>
      </Reveal>

      <Reveal className="tp-atlas-section">
        <h2 className="tp-atlas-h2">{t("filesTitle")}</h2>
        <p className="tp-atlas-p">{t("filesBody")}</p>
      </Reveal>

      <Reveal className="tp-atlas-section">
        <h2 className="tp-atlas-h2">{t("dataTitle")}</h2>
        <p className="tp-atlas-p">{t("dataBody")}</p>
        <ul className="tp-atlas-list">
          <li>{t("dataList1")}</li>
          <li>{t("dataList2")}</li>
          <li>{t("dataList3")}</li>
        </ul>
      </Reveal>

      <Reveal className="tp-atlas-section">
        <h2 className="tp-atlas-h2">{t("cookiesTitle")}</h2>
        <p className="tp-atlas-p">{t("cookiesBody")}</p>
      </Reveal>
    </SecondaryPage>
  );
}
