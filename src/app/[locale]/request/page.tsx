import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { ArrowRight, ShieldCheck } from "lucide-react";
import RequestForm from "./form";

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

  const steps = [
    "Describe the job, the input and what a good result looks like.",
    "We read the request and check whether it fits the collection.",
    "If we build it, we reply to the email you leave. No newsletter, no account.",
  ];

  return (
    <main className="tp-container" style={{ paddingBottom: 64 }}>
      <section className="tp-page-hero">
        <div className="tp-page-hero-grid">
          <div className="tp-page-title">
            <p className="tp-eyebrow">{labels.eyebrow}</p>
            <h1>{labels.title}</h1>
            <p>{labels.description}</p>
          </div>
          <span className="tp-page-count">EVERY REQUEST IS READ</span>
        </div>
      </section>

      <section className="tp-split" style={{ paddingTop: 8 }}>
        <div className="tp-split-copy">
          <p className="tp-eyebrow">How it works</p>
          <h2 className="tp-request-title">A short note is enough</h2>
          <p>
            You do not need to design the tool or know what to call it. Describe
            the problem in your own words and we will take it from there.
          </p>

          <div style={{ marginTop: 28 }}>
            {steps.map((step) => (
              <div key={step} className="tp-step">
                <p>{step}</p>
              </div>
            ))}
          </div>

          <p style={{ display: "flex", alignItems: "flex-start", gap: 9, marginTop: 22, color: "var(--muted)", fontSize: 12.5, lineHeight: 1.6 }}>
            <ShieldCheck className="tp-icon" style={{ width: 13, height: 13, color: "var(--accent)" }} aria-hidden="true" />
            <span>Requests are private. We never publish your email or share it with anyone.</span>
          </p>
        </div>

        <RequestForm labels={labels} />
      </section>

      <div style={{ marginTop: 32 }}>
        <a href="mailto:hello@toolpika.site" className="tp-text-link">
          Prefer email? Write to us
          <ArrowRight className="tp-icon" aria-hidden="true" />
        </a>
      </div>
    </main>
  );
}
