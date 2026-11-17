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
    <header className="sticky top-6 z-40 mt-6 mx-auto w-full sm:w-max rounded-[20px] border border-[var(--border)] bg-[var(--surface)]/80 backdrop-blur-[14px] px-4 py-1.5 shadow-[0_8px_32px_rgba(0,0,0,0.06)]">
      <div className="mx-auto flex h-full w-full max-w-page items-center justify-between gap-2 px-4 sm:px-6">
        <Link
          href="/"
          className="flex shrink-0 items-center gap-2 font-display text-[22px] font-normal leading-none tracking-[0.01em] text-[var(--text)] sm:text-[28px]"
          aria-label="Toolpika"
        >
          <Search className="h-5 w-5 text-[var(--accent)]" aria-hidden="true" />
          Toolpika
        </Link>

        <nav className="hidden md:flex items-center gap-6 text-[14px] text-[var(--muted)]">
          {NAV.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded-[10px] px-3 py-1.5 transition-colors duration-200 ${
                  active
                    ? "bg-[var(--accent-fill)] text-[var(--on-accent)]"
                    : "hover:text-[var(--text)] hover:bg-[var(--bg)]"
                }`}
              >
                {t(item.key)}
              </Link>
            );
          })}
        </nav>

        <div className="flex shrink-0 items-center gap-1 sm:gap-2">
          <LocaleSwitcher />
          <ThemeToggle />
          <Link
            href="/request"
            className="inline-flex items-center justify-center rounded-[12px] bg-[var(--accent-fill)] px-5 py-2 font-bold text-[var(--on-accent)] text-sm transition-all duration-200 hover:bg-[var(--accent-fill-hover)] hover:scale-[1.02] focus-visible:outline-2 focus-visible:outline-[var(--accent)] focus-visible:outline-offset-3 sm:px-6"
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
