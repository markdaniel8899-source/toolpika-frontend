import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import RequestForm from "./form";

type LocalePageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({
  params,
}: LocalePageProps): Promise<Metadata> {
  const { locale } = await params;

  return {
    title: "Request a tool | Toolpika",
    description:
      "Tell us what tool you need. We read every request and build the most asked-for ones first.",
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

  return (
    <main className="mx-auto w-full max-w-page px-6 py-24">
      <RequestForm labels={labels} />
    </main>
  );
}
