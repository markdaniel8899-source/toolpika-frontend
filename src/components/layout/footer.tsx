import { Mail, ExternalLink, Zap } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

const TOOLS_LINKS = [
  { key: "tools", href: "/" },
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

export function Footer() {
  const t = useTranslations("footer");
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-[var(--border)] bg-[var(--surface)] py-[48px] pt-[48px] pb-[24px]">
      <div className="mx-auto max-w-page px-6">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Zap className="h-5 w-5 text-[var(--accent)]" aria-hidden="true" />
              <span className="font-sans font-semibold text-[20px] tracking-tight text-[var(--text)]">
                Toolpika
              </span>
            </div>
            <p className="mt-[8px] text-[14px] leading-[1.6] text-[var(--muted)]">
              {t("tagline")}
            </p>
            <div className="mt-4 flex gap-3">
              <a
                href="mailto:hello@toolpika.site"
                className="h-8 w-8 flex items-center justify-center rounded-[var(--radius-md)] border border-[var(--border)] text-[var(--muted)] transition-[color,border-color] duration-[var(--dur-fast)] ease-[var(--ease-out)] hover:text-[var(--accent)] hover:border-[var(--accent)] focus-visible:outline-2 focus-visible:outline-[var(--accent)] focus-visible:outline-offset-3"
                aria-label="Email"
              >
                <Mail className="h-4 w-4" aria-hidden="true" />
              </a>
              <a
                href="https://github.com/toolpika"
                target="_blank"
                rel="noopener noreferrer"
                className="h-8 w-8 flex items-center justify-center rounded-[var(--radius-md)] border border-[var(--border)] text-[var(--muted)] transition-[color,border-color] duration-[var(--dur-fast)] ease-[var(--ease-out)] hover:text-[var(--accent)] hover:border-[var(--accent)] focus-visible:outline-2 focus-visible:outline-[var(--accent)] focus-visible:outline-offset-3"
                aria-label="GitHub"
              >
                <ExternalLink className="h-4 w-4" aria-hidden="true" />
              </a>
            </div>
          </div>

          {/* Tools */}
          <div>
            <h3 className="mb-[12px] text-[14px] font-semibold tracking-tight text-[var(--text)]">
              {t("tools")}
            </h3>
            <ul className="space-y-[12px]">
              {TOOLS_LINKS.map((item) => (
                <li key={item.key}>
                  <Link
                    href={item.href}
                    className="block text-[14px] text-[var(--muted)] transition-[color] duration-[var(--dur-fast)] ease-[var(--ease-out)] hover:text-[var(--accent)]"
                  >
                    {t(item.key)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="mb-[12px] text-[14px] font-semibold tracking-tight text-[var(--text)]">
              {t("company")}
            </h3>
            <ul className="space-y-[12px]">
              {COMPANY_LINKS.map((item) => (
                <li key={item.key}>
                  <Link
                    href={item.href}
                    className="block text-[14px] text-[var(--muted)] transition-[color] duration-[var(--dur-fast)] ease-[var(--ease-out)] hover:text-[var(--accent)]"
                  >
                    {t(item.key)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="mb-[12px] text-[14px] font-semibold tracking-tight text-[var(--text)]">
              {t("legal")}
            </h3>
            <ul className="space-y-[12px]">
              {LEGAL_LINKS.map((item) => (
                <li key={item.key}>
                  <Link
                    href={item.href}
                    className="block text-[14px] text-[var(--muted)] transition-[color] duration-[var(--dur-fast)] ease-[var(--ease-out)] hover:text-[var(--accent)]"
                  >
                    {t(item.key)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-[40px] border-t border-[var(--border)] pt-[24px] text-center">
          <p className="text-[13px] text-[var(--muted)]">
            © {year} Toolpika. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
