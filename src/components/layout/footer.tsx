import { Mail, ExternalLink } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

const BRAND_LINKS = [
  { key: "popular", href: "/popular" },
  { key: "new", href: "/new" },
  { key: "guides", href: "/guides" },
  { key: "request", href: "/request" },
] as const;

const COMPANY_LINKS = [
  { key: "about", href: "/about" },
  { key: "contact", href: "/contact" },
] as const;

const LEGAL_LINKS = [
  { key: "privacy", href: "/privacy" },
  { key: "terms", href: "/terms" },
] as const;

export function Footer() {
  const t = useTranslations("footer");
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-[var(--border)] bg-[var(--surface)] py-12">
      <div className="mx-auto max-w-page px-6">
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div className="col-span-1 lg:col-span-1">
            <div className="flex items-center gap-2.5 mb-3">
              <span className="flex h-7 w-7 items-center justify-center rounded-[var(--radius-md)] bg-[var(--accent-fill)] text-[var(--accent-fg)] font-heading font-bold text-[16px] leading-none tracking-tight">
                T
              </span>
              <span className="font-heading text-[16px] font-bold tracking-[-0.01em] text-[var(--text)] sm:text-[18px]">
                Toolpika
              </span>
            </div>
            <p className="mb-4 max-w-[260px] text-sm leading-[1.6] text-[var(--muted)]">
              {t("tagline")}
            </p>
            <div className="flex gap-3">
              <a
                href="mailto:hello@toolpika.site"
                className="h-9 w-9 flex items-center justify-center rounded-[var(--radius-md)] border border-[var(--border)] text-[var(--muted)] hover:text-[var(--text)] hover:border-[var(--text)] transition-colors duration-[var(--dur-fast)] ease-[var(--ease-out)] focus-visible:outline-2 focus-visible:outline-[var(--ring)] focus-visible:outline-offset-3"
                aria-label="Email"
              >
                <Mail className="h-4 w-4" aria-hidden="true" />
              </a>
              <a
                href="https://github.com/toolpika"
                target="_blank"
                rel="noopener noreferrer"
                className="h-9 w-9 flex items-center justify-center rounded-[var(--radius-md)] border border-[var(--border)] text-[var(--muted)] hover:text-[var(--text)] hover:border-[var(--text)] transition-colors duration-[var(--dur-fast)] ease-[var(--ease-out)] focus-visible:outline-2 focus-visible:outline-[var(--ring)] focus-visible:outline-offset-3"
                aria-label="GitHub"
              >
                <ExternalLink className="h-4 w-4" aria-hidden="true" />
              </a>
            </div>
          </div>

          {/* Tools */}
          <div>
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-[0.15em] text-[var(--muted)]">
              {t("tools")}
            </h3>
            <ul className="space-y-2">
              {BRAND_LINKS.map((item) => (
                <li key={item.key}>
                  <Link
                    href={item.href}
                    className="text-sm text-[var(--muted)] hover:text-[var(--accent)] transition-colors duration-[var(--dur-fast)] ease-[var(--ease-out)]"
                  >
                    {t(item.key)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-[0.15em] text-[var(--muted)]">
              {t("company")}
            </h3>
            <ul className="space-y-2">
              {COMPANY_LINKS.map((item) => (
                <li key={item.key}>
                  <Link
                    href={item.href}
                    className="text-sm text-[var(--muted)] hover:text-[var(--accent)] transition-colors duration-[var(--dur-fast)] ease-[var(--ease-out)]"
                  >
                    {t(item.key)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-[0.15em] text-[var(--muted)]">
              {t("legal")}
            </h3>
            <ul className="space-y-2">
              {LEGAL_LINKS.map((item) => (
                <li key={item.key}>
                  <Link
                    href={item.href}
                    className="text-sm text-[var(--muted)] hover:text-[var(--accent)] transition-colors duration-[var(--dur-fast)] ease-[var(--ease-out)]"
                  >
                    {t(item.key)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-10 border-t border-[var(--border)] pt-8 flex flex-col items-center gap-4 text-sm text-[var(--muted)] sm:flex-row sm:justify-between sm:gap-8">
          <p>{t("copyright", { year })}</p>
          <p>Runs in your browser</p>
        </div>
      </div>
    </footer>
  );
}
