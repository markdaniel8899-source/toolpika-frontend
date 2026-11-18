import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { ArrowRight } from "lucide-react";

export default function NotFoundPage() {
  const t = useTranslations("notFound");

  return (
    <main
      className="tp-container"
      style={{ minHeight: "60vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center" }}
    >
      <p className="tp-eyebrow">404</p>
      <h1 className="tp-section-title" style={{ marginTop: 12 }}>{t("title")}</h1>
      <p style={{ maxWidth: 420, marginTop: 12, color: "var(--muted)", fontSize: 15, lineHeight: 1.65 }}>
        {t("description")}
      </p>
      <Link href="/" className="tp-btn tp-btn-primary" style={{ marginTop: 32 }}>
        {t("back")}
        <ArrowRight className="tp-icon" aria-hidden="true" />
      </Link>
    </main>
  );
}
