import { ArrowRight, ExternalLink, Mail, Zap } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

const TOOLS_LINKS = [
  { key: "tools", href: "/all-tools" },
  { key: "popular", href: "/popular" },
  { key: "new", href: "/new" },
  { key: "request", href: "/request" },
] as const;

const COMPANY_LINKS = [
  { key: "about", href: "/about" },
  { key: "guides", href: "/guides" },
  { key: "contact", href: "/contact" },
] as const;

const LEGAL_LINKS = [
  { key: "privacy", href: "/privacy" },
  { key: "terms", href: "/terms" },
  { key: "contact", href: "/contact" },
] as const;

function FooterGroup({
  title,
  links,
  t,
}: {
  title: string;
  links: ReadonlyArray<{ key: string; href: string }>;
  t: (key: string) => string;
}) {
  return (
    <div className="tp-footer-col">
      <h3>{title}</h3>
      <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
        {links.map((item) => (
          <li key={`${item.key}-${item.href}`}>
            <Link href={item.href} className="footer-link">
              {t(item.key)}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function Footer() {
  const t = useTranslations("footer");
  const year = new Date().getFullYear();

  return (
    <footer className="tp-footer">
      <div className="tp-container">
        <div className="tp-footer-grid">
          <div className="tp-footer-brand">
            <Link href="/" className="tp-brand" aria-label="Toolpika">
              <Zap className="tp-brand-mark" aria-hidden="true" />
              Toolpika
            </Link>
            <p>{t("tagline")}</p>
            <div style={{ display: "flex", gap: 10, marginTop: 18 }}>
              <a
                href="mailto:hello@toolpika.site"
                className="tp-icon-btn tp-icon-only"
                aria-label="Email"
              >
                <Mail className="tp-icon" aria-hidden="true" />
              </a>
              <a
                href="https://github.com/toolpika"
                target="_blank"
                rel="noopener noreferrer"
                className="tp-icon-btn tp-icon-only"
                aria-label="GitHub"
              >
                <ExternalLink className="tp-icon" aria-hidden="true" />
              </a>
            </div>
          </div>

          <FooterGroup title={t("tools")} links={TOOLS_LINKS} t={t} />
          <FooterGroup title={t("company")} links={COMPANY_LINKS} t={t} />
          <FooterGroup title={t("legal")} links={LEGAL_LINKS} t={t} />
        </div>

        <div className="tp-footer-bottom">
          <span>© {year} Toolpika. All rights reserved.</span>
          <Link href="/request" className="tp-text-link footer-link">
            Request a tool
            <ArrowRight className="tp-icon" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </footer>
  );
}
