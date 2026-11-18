import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import RequestForm from "./form";
import { SecondaryPage } from "@/components/layout/secondary-page";
import { Reveal } from "@/components/ui/reveal";

type LocalePageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({
  params,
}: LocalePageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "request" });
  return {
    title: `${t("title")} | Toolpika`,
    description: t("description"),
    alternates: {
      canonical: `https://toolpika.site/${locale}/request`,
    },
  };
}

export default async function RequestPage({ params }: LocalePageProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "request" });

  const labels = {
    eyebrow: t("eyebrow"),
    title: t("title"),
    description: t("description"),
    toolNameLabel: t("toolNameLabel"),
    toolNamePlaceholder: t("toolNamePlaceholder"),
    descriptionLabel: t("descriptionLabel"),
    descriptionPlaceholder: t("descriptionPlaceholder"),
    emailLabel: t("emailLabel"),
    emailPlaceholder: t("emailPlaceholder"),
    emailHint: t("emailHint"),
    submit: t("submit"),
    backHome: t("backHome"),
  };

  // Mirrors the Contact page: one centred column, same container and rhythm.
  return (
    <SecondaryPage>
      <Reveal className="tp-request-head">
        <p className="tp-atlas-eyebrow">{labels.eyebrow}</p>
        <h1 className="tp-atlas-title">{labels.title}</h1>
        <p className="tp-atlas-lead">{labels.description}</p>
      </Reveal>

      <Reveal delay={80} className="tp-request-shell">
        <RequestForm labels={labels} />
      </Reveal>
    </SecondaryPage>
  );
}
