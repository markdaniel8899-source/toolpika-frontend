import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { SecondaryPage } from "@/components/layout/secondary-page";
import { Reveal } from "@/components/ui/reveal";

type LocalePageProps = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: LocalePageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "terms" });
  return { title: t("title"), description: t("description") };
}

export default async function TermsPage({ params }: LocalePageProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "terms" });

  const sections = [
    { title: t("useTitle"), body: t("useBody") },
    { title: t("liabilityTitle"), body: t("liabilityBody") },
    { title: t("changesTitle"), body: t("changesBody") },
  ];

  return (
    <SecondaryPage>
      <Reveal>
        <p className="tp-atlas-eyebrow">{t("eyebrow")}</p>
        <h1 className="tp-atlas-title">{t("title")}</h1>
        <p className="tp-atlas-date">{t("updated")}</p>
        <p className="tp-atlas-lead">{t("description")}</p>
      </Reveal>

      {sections.map((section, index) => (
        <Reveal key={section.title} className="tp-atlas-section" delay={index * 60}>
          <h2 className="tp-atlas-h2">{section.title}</h2>
          <p className="tp-atlas-p">{section.body}</p>
        </Reveal>
      ))}
    </SecondaryPage>
  );
}
