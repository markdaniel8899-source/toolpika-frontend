"use client";

import { Plus, Search } from "lucide-react";
import { usePathname } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { ThemeToggle } from "@/components/theme-toggle";

const NAV = [
  { href: "/", key: "tools" },
  { href: "/popular", key: "popular" },
  { href: "/new", key: "new" },
  { href: "/guides", key: "guides" },
] as const;

export function Header() {
  const t = useTranslations("nav");
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 h-16 border-b border-[var(--border)] bg-[var(--surface)]/90 backdrop-blur-[8px]">
      <div className="mx-auto flex h-full w-full max-w-page items-center justify-between gap-2 px-4 sm:px-6">
        <Link
          href="/"
          className="flex shrink-0 items-center gap-2 font-display text-[24px] leading-none tracking-[0.01em] text-[var(--text)] sm:text-[30px]"
          aria-label="Toolpika"
        >
          <Search className="h-5 w-5 text-[var(--accent)]" aria-hidden="true" />
          Toolpika
        </Link>

        <nav className="hidden md:flex items-center gap-7 text-[15px] text-[var(--muted)]">
          {NAV.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded-[10px] px-3 py-2 transition-colors duration-200 ${
                  active
                    ? "bg-[var(--surface)] text-[var(--text)]"
                    : "hover:text-[var(--text)]"
                }`}
              >
                {t(item.key)}
              </Link>
            );
          })}
        </nav>

        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
          <LocaleSwitcher />
          <ThemeToggle />
          <Link
            href="/request"
            className="inline-flex items-center rounded-[10px] border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm font-bold text-[var(--text)] transition-colors duration-200 hover:border-[var(--accent)] focus-visible:outline-2 focus-visible:outline-[var(--accent)] focus-visible:outline-offset-3 sm:px-4"
          >
            <Plus className="h-4 w-4 sm:mr-2" aria-hidden="true" />
            <span className="hidden sm:inline">{t("request")}</span>
            <span className="sr-only sm:hidden">{t("request")}</span>
          </Link>
        </div>
      </div>
    </header>
  );
}
