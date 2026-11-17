"use client";

import { useState } from "react";
import { Zap, Search, Sun, Moon, Globe, Menu, X, ArrowRight } from "lucide-react";
import { usePathname } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/", key: "tools" },
  { href: "/popular", key: "popular" },
  { href: "/new", key: "new" },
  { href: "/guides", key: "guides" },
] as const;

const LOCALES = [
  { code: "en", label: "English" },
  { code: "de", label: "Deutsch" },
  { code: "fr", label: "Français" },
  { code: "es", label: "Español" },
  { code: "pt-BR", label: "Português" },
  { code: "ru", label: "Русский" },
  { code: "tr", label: "Türkçe" },
  { code: "it", label: "Italiano" },
  { code: "ar", label: "العربية" },
  { code: "hi", label: "हिन्दी" },
] as const;

export function Header() {
  const t = useTranslations("nav");
  const l = useTranslations("language");
  const th = useTranslations("theme");
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const [locale, setLocale] = useState<string>(() => {
    if (typeof document === "undefined") return "en";
    return document.documentElement.lang || "en";
  });
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    if (typeof document === "undefined") return "light";
    return (document.documentElement.getAttribute("data-theme") as "light" | "dark") ?? "light";
  });

  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    const root = document.documentElement;
    root.setAttribute("data-theme", next);
    try {
      localStorage.setItem("theme", next);
    } catch {
      // Storage can be blocked; the attribute still updates for this session.
    }
  };

  return (
    <header
      className="sticky top-0 z-50 h-[64px] border-b border-[var(--border)] bg-[var(--surface)]/90 backdrop-blur-[10px] transition-all duration-300 ease-out"
    >
      <div className="mx-auto flex h-full w-full max-w-page items-center justify-between gap-2 px-4 sm:px-6">
        {/* Left: Logo */}
        <Link href="/" className="flex shrink-0 items-center gap-2" aria-label="Toolpika">
          <Zap className="h-5 w-5 text-[var(--accent)]" aria-hidden="true" />
          <span className="font-sans font-bold text-[24px] tracking-tight text-[var(--text)]">
            Toolpika
          </span>
        </Link>

        {/* Center: nav links (desktop) */}
        <nav className="hidden md:flex items-center gap-6 text-[15px] font-medium text-[var(--muted)]">
          {NAV.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "px-3 py-2 relative transition-all duration-300 ease-out",
                  active
                    ? "text-[var(--accent)] after:absolute after:-bottom-[2px] after:left-0 after:right-0 after:h-[2px] after:bg-[var(--accent)] after:rounded-full"
                    : "hover:text-[var(--text)] hover:after:absolute hover:after:-bottom-[2px] hover:after:left-0 hover:after:right-0 hover:after:h-[2px] hover:after:bg-[var(--accent)] hover:after:rounded-full",
                )}
              >
                {t(item.key)}
              </Link>
            );
          })}
        </nav>

        {/* Right: actions */}
        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          {/* Language Dropdown (smooth, theme-related) */}
          <select
            value={locale}
            onChange={(event) => {
              setLocale(event.target.value);
            }}
            className={cn(
              "flex h-9 w-9 items-center justify-center rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] text-[var(--muted)]",
              "transition-all duration-300 ease-out hover:border-[var(--accent)] hover:text-[var(--text)]",
              "appearance-none sm:px-3 sm:py-2",
            )}
            aria-label={l("label")}
          >
            {LOCALES.map((item) => (
              <option key={item.code} value={item.code}>
                {item.label}
              </option>
            ))}
          </select>

          {/* Theme Toggle */}
          <button
            type="button"
            onClick={toggleTheme}
            aria-label={th("toggle")}
            className={cn(
              "inline-flex h-9 w-9 items-center justify-center rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] text-[var(--muted)]",
              "transition-all duration-300 ease-out hover:text-[var(--text)] hover:border-[var(--accent)]",
            )}
          >
            {theme === "dark" ? (
              <Sun className="h-5 w-5" aria-hidden="true" />
            ) : (
              <Moon className="h-5 w-5" aria-hidden="true" />
            )}
          </button>

          {/* Request a tool CTA */}
          <Link
            href="/request"
            className={cn(
              "inline-flex items-center justify-center rounded-lg bg-[var(--accent-fill)] px-5 py-2 font-medium text-[var(--on-accent)] text-sm",
              "transition-all duration-300 ease-out hover:bg-[var(--accent-fill-hover)] hover:scale-[1.02]",
              "hidden sm:flex",
            )}
          >
            <ArrowRight className="h-4 w-4 mr-1.5" aria-hidden="true" />
            {t("request")}
          </Link>

          {/* Mobile menu button */}
          <button
            type="button"
            onClick={() => setMenuOpen((prev) => !prev)}
            className={cn(
              "inline-flex h-9 w-9 items-center justify-center rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] text-[var(--muted)]",
              "transition-all duration-300 ease-out hover:text-[var(--text)] hover:bg-[var(--surface-2)]",
              "md:hidden",
            )}
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
          >
            {menuOpen ? (
              <X className="h-5 w-5" aria-hidden="true" />
            ) : (
              <Menu className="h-5 w-5" aria-hidden="true" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile sheet */}
      {menuOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
            onClick={() => setMenuOpen(false)}
            aria-hidden="true"
          />
          <div
            className={cn(
              "fixed inset-y-0 right-0 z-50 w-full sm:w-80 bg-[var(--surface)] border-l border-[var(--border)] shadow-[var(--shadow-md)]",
              "transform transition-transform duration-300 ease-out",
              menuOpen ? "translate-x-0" : "-translate-x-full",
            )}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border)]">
              <button
                type="button"
                onClick={() => setMenuOpen(false)}
                className="rounded-[var(--radius-md)] p-2 text-[var(--muted)] hover:bg-[var(--surface-2)] hover:text-[var(--text)] transition-all duration-300"
                aria-label="Close menu"
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>
            <nav className="px-5 py-4 space-y-1">
              {NAV.map((item) => {
                const active = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMenuOpen(false)}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-[var(--radius-md)] text-sm font-medium transition-all duration-300",
                      active
                        ? "bg-[var(--accent-soft)] text-[var(--accent)]"
                        : "text-[var(--text)] hover:bg-[var(--surface-2)]",
                    )}
                  >
                    {t(item.key)}
                  </Link>
                );
              })}
            </nav>
            <div className="px-5 py-4 border-t border-[var(--border)] mt-4">
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-[0.15em] text-[var(--muted)]">
                Language
              </h3>
              <div className="space-y-1">
                {LOCALES.map((item) => (
                  <button
                    key={item.code}
                    onClick={() => {
                      setLocale(item.code);
                      setMenuOpen(false);
                    }}
                    className="flex w-full items-center gap-3 px-3 py-2 rounded-[var(--radius-md)] text-sm font-medium text-[var(--text)] hover:bg-[var(--surface-2)] hover:text-[var(--accent)] transition-all duration-300"
                  >
                    <span className="font-medium">{item.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </header>
  );
}
