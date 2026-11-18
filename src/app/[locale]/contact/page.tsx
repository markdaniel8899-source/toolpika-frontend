import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { ArrowRight, Clock3, Mail, MessageSquare } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { SecondaryPage } from "@/components/layout/secondary-page";
import { Reveal } from "@/components/ui/reveal";
import { ContactForm } from "./form";

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
    <SecondaryPage wide>
      <Reveal>
        <p className="tp-atlas-eyebrow">{t("eyebrow")}</p>
        <h1 className="tp-atlas-title">Get in <span className="soft">touch</span></h1>
        <p className="tp-atlas-lead">{t("description")}</p>
      </Reveal>

      <div className="tp-atlas-contact-grid">
        <Reveal>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "8px 14px", borderRadius: 999, background: "var(--surface-2)", color: "var(--muted)", fontSize: 13 }}>
            <span style={{ display: "grid", placeItems: "center", width: 20, height: 20, borderRadius: "50%", background: "var(--accent-soft)", color: "var(--accent)" }}>
              <Mail className="tp-icon" style={{ width: 12, height: 12 }} aria-hidden="true" />
            </span>
            Direct line
          </div>

          <div className="tp-atlas-contact-rows">
            <a href="mailto:hello@toolpika.site" className="tp-atlas-contact-row">
              <span className="tp-icon-tile"><Mail className="tp-icon" aria-hidden="true" /></span>
              <span style={{ flex: 1 }}>
                <strong>{t("emailLabel")}</strong>
                <span>hello@toolpika.site</span>
              </span>
              <ArrowRight className="tp-icon" style={{ color: "var(--accent)" }} aria-hidden="true" />
            </a>
            <div className="tp-atlas-contact-row">
              <span className="tp-icon-tile"><Clock3 className="tp-icon" aria-hidden="true" /></span>
              <span style={{ flex: 1 }}>
                <strong>Response time</strong>
                <span>{t("responseTime")}</span>
              </span>
            </div>
            <Link href="/request" className="tp-atlas-contact-row">
              <span className="tp-icon-tile"><MessageSquare className="tp-icon" aria-hidden="true" /></span>
              <span style={{ flex: 1 }}>
                <strong>Tool requests</strong>
                <span>Ask for a utility you need.</span>
              </span>
              <ArrowRight className="tp-icon" style={{ color: "var(--accent)" }} aria-hidden="true" />
            </Link>
          </div>
        </Reveal>

        <Reveal delay={80}>
          <ContactForm
            copy={{
              name: "Name",
              email: t("emailLabel"),
              message: "Message",
              submit: "Open email draft",
              note: "This opens your mail app with the message ready to send.",
            }}
          />
        </Reveal>
      </div>
    </SecondaryPage>
  );
}
