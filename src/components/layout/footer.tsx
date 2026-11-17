import { Mail, ExternalLink } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

const LINKS = {
  tools: [
    { key: "popular", href: "/popular" },
    { key: "new", href: "/new" },
    { key: "guides", href: "/guides" },
    { key: "request", href: "/request" },
  ],
  company: [
    { key: "about", href: "/about" },
    { key: "privacy", href: "/privacy" },
    { key: "terms", href: "/terms" },
    { key: "contact", href: "/contact" },
  ],
};

export function Footer() {
  const t = useTranslations("footer");
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-[var(--border)] bg-[var(--surface)] py-16">
      <div className="mx-auto max-w-page px-6">
        <div className="grid grid-cols-1 gap-12 md:grid-cols-2 lg:grid-cols-4">
          <div className="col-span-1 lg:col-span-1">
            <span className="font-display text-lg font-normal tracking-[0.01em] text-[var(--text)]">
              Toolpika
            </span>
            <p className="mt-3 text-sm text-[var(--muted)]">
              {t("tagline")}
            </p>
            <div className="mt-4 flex gap-3">
              <a
                href="mailto:hello@toolpika.site"
                className="rounded-[10px] p-2 border border-[var(--border)] text-[var(--muted)] hover:text-[var(--text)] hover:border-[var(--text)] transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-[var(--accent)] focus-visible:outline-offset-3"
                aria-label="Email"
              >
                <Mail className="h-4 w-4" aria-hidden="true" />
              </a>
              <a
                href="https://github.com/toolpika"
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-[10px] p-2 border border-[var(--border)] text-[var(--muted)] hover:text-[var(--text)] hover:border-[var(--text)] transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-[var(--accent)] focus-visible:outline-offset-3"
                aria-label="GitHub"
              >
                <ExternalLink className="h-4 w-4" aria-hidden="true" />
              </a>
            </div>
          </div>

          <div>
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-[0.15em] text-[var(--text)]">
              {t("tools")}
            </h3>
            <ul className="space-y-2">
              {LINKS.tools.map((item) => (
                <li key={item.key}>
                  <Link
                    href={item.href}
                    className="text-sm text-[var(--muted)] hover:text-[var(--accent)] transition-colors duration-200"
                  >
                    {t(item.key)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-[0.15em] text-[var(--text)]">
              {t("company")}
            </h3>
            <ul className="space-y-2">
              {LINKS.company.map((item) => (
                <li key={item.key}>
                  <Link
                    href={item.href}
                    className="text-sm text-[var(--muted)] hover:text-[var(--accent)] transition-colors duration-200"
                  >
                    {t(item.key)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-[0.15em] text-[var(--text)]">
              {t("legal")}
            </h3>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/privacy"
                  className="text-sm text-[var(--muted)] hover:text-[var(--accent)] transition-colors duration-200"
                >
                  {t("privacy")}
                </Link>
              </li>
              <li>
                <Link
                  href="/terms"
                  className="text-sm text-[var(--muted)] hover:text-[var(--accent)] transition-colors duration-200"
                >
                  {t("terms")}
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 border-t border-[var(--border)] pt-6 flex flex-col items-center gap-2 text-sm text-[var(--muted)] sm:flex-row sm:justify-between">
          <p>{t("copyright", { year })}</p>
        </div>
      </div>
    </footer>
  );
}
