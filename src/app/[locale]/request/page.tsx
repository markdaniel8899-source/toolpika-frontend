import type { Metadata } from "next";
import { localizedAlternates } from "@/lib/seo/alternates";
import { getTranslations } from "next-intl/server";
import { ShieldCheck, Sparkles, MessageSquare } from "lucide-react";
import RequestForm from "./form";
import { SecondaryPage } from "@/components/layout/secondary-page";
import { Reveal } from "@/components/ui/reveal";
import { JsonLdScripts } from "@/components/seo/json-ld";
import { buildWebPageSchemas } from "@/lib/seo/json-ld";
import { getSiteUrl } from "@/lib/site-url";

type LocalePageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({
  params,
}: LocalePageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "request" });
  return {
    title: t("title"),
    description: t("description"),
    alternates: localizedAlternates(locale, "/request"),
  };
}

export default async function RequestPage({ params }: LocalePageProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "request" });
  const schemas = buildWebPageSchemas({
    locale,
    siteUrl: getSiteUrl(),
    path: "/request",
    name: t("title"),
    description: t("description"),
  });

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

  // Left: heading + short supporting content. Right: the form card.
  // Mirrors the Contact page's two-column rhythm and container width.
  return (
    <SecondaryPage wide>
      <JsonLdScripts schemas={schemas} />
      <div className="tp-request-grid">
        <Reveal className="tp-request-copy">
          <p className="tp-atlas-eyebrow">{labels.eyebrow}</p>
          <h1 className="tp-atlas-title">{labels.title}</h1>
          <p className="tp-atlas-lead">{labels.description}</p>

          <ul className="tp-request-points">
            <li>
              <span className="tp-request-point-icon">
                <Sparkles className="tp-icon" aria-hidden="true" />
              </span>
              <span>
                <strong>{t("point1Title")}</strong>
                <span>{t("point1Body")}</span>
              </span>
            </li>
            <li>
              <span className="tp-request-point-icon">
                <MessageSquare className="tp-icon" aria-hidden="true" />
              </span>
              <span>
                <strong>{t("point2Title")}</strong>
                <span>{t("point2Body")}</span>
              </span>
            </li>
            <li>
              <span className="tp-request-point-icon">
                <ShieldCheck className="tp-icon" aria-hidden="true" />
              </span>
              <span>
                <strong>{t("point3Title")}</strong>
                <span>{t("point3Body")}</span>
              </span>
            </li>
          </ul>
        </Reveal>

        <Reveal delay={80} className="tp-request-shell">
          <RequestForm labels={labels} />
        </Reveal>
      </div>
    </SecondaryPage>
  );
}
