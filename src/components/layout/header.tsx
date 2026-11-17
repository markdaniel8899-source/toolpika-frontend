"use client";

import { useState } from "react";
import { Zap, Sun, Moon, Menu, X, ArrowRight } from "lucide-react";
import { usePathname } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import { useScrolled } from "@/hooks/useScrolled";

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
  const scrolled = useScrolled(8);
  const [menuOpen, setMenuOpen] = useState(false);
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
      className={cn(
        "sticky top-0 z-50 h-[64px] border-b bg-[var(--surface)]/90 backdrop-blur-[12px] transition-[background-color,border-color] duration-[var(--dur-base)] ease-[var(--ease-out)]",
        scrolled && "shadow-[var(--shadow-sm)]",
      )}
    >
      <div className="mx-auto flex h-full w-full max-w-page items-center justify-between gap-2 px-4 sm:px-6">
        {/* Left: Logo */}
        <Link href="/" className="flex shrink-0 items-center gap-2" aria-label="Toolpika">
          <Zap className="h-5 w-5 text-[var(--accent)]" aria-hidden="true" />
          <span className="font-sans text-[20px] font-semibold tracking-tight text-[var(--text)]">
            Toolpika
          </span>
        </Link>

        {/* Center: nav links (desktop) */}
        <nav className="hidden md:flex items-center gap-1 text-[14px] font-medium text-[var(--muted)]">
          {NAV.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "group relative px-4 py-2 text-[var(--muted)] transition-colors duration-[var(--dur-fast)] ease-[var(--ease-out)] hover:text-[var(--text)]",
                  active && "text-[var(--accent)]",
                )}
              >
                {t(item.key)}
                <span
                  aria-hidden="true"
                  className={cn(
                    "absolute bottom-0 left-0 h-[2px] w-0 rounded-full bg-[var(--accent)] transition-[width] duration-[var(--dur-base)] ease-[var(--ease-out)]",
                    active ? "w-full" : "group-hover:w-full",
                  )}
                />
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
              "flex h-9 w-9 items-center justify-center rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] px-2 text-[13px] text-[var(--text)] transition-[border-color,color] duration-[var(--dur-fast)] ease-[var(--ease-out)] hover:border-[var(--accent)] hover:text-[var(--text)] focus-visible:outline-2 focus-visible:outline-[var(--accent)] focus-visible:outline-offset-3 sm:h-10 sm:w-auto sm:px-3 sm:text-sm",
              "appearance-none",
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
              "inline-flex h-9 w-9 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--surface)] text-[var(--muted)] transition-[color,border-color] duration-[var(--dur-fast)] ease-[var(--ease-out)] hover:text-[var(--text)] hover:border-[var(--accent)] focus-visible:outline-2 focus-visible:outline-[var(--accent)] focus-visible:outline-offset-3 sm:h-10 sm:w-10",
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
              "hidden sm:inline-flex h-9 items-center justify-center rounded-[var(--radius-md)] bg-[var(--accent-fill)] px-5 font-semibold text-[var(--on-accent)] text-sm transition-[background-color,transform] duration-[var(--dur-fast)] ease-[var(--ease-out)] hover:bg-[var(--accent-fill-hover)] hover:scale-[1.02] focus-visible:outline-2 focus-visible:outline-[var(--accent)] focus-visible:outline-offset-3 active:scale-[0.98] md:h-10",
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
              "inline-flex h-9 w-9 items-center justify-center rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] text-[var(--muted)] transition-[color,border-color,background-color] duration-[var(--dur-fast)] ease-[var(--ease-out)] hover:text-[var(--text)] hover:border-[var(--accent)] focus-visible:outline-2 focus-visible:outline-[var(--accent)] focus-visible:outline-offset-3 md:hidden",
            )}
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
          >
            {menuOpen ? <X className="h-5 w-5" aria-hidden="true" /> : <Menu className="h-5 w-5" aria-hidden="true" />}
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
              "transform transition-transform duration-[var(--dur-slow)] ease-[var(--ease-drawer)]",
              menuOpen ? "translate-x-0" : "-translate-x-full",
            )}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border)]">
              <Link href="/" className="flex items-center gap-2" onClick={() => setMenuOpen(false)}>
                <Zap className="h-5 w-5 text-[var(--accent)]" aria-hidden="true" />
                <span className="font-sans text-[20px] font-semibold tracking-tight text-[var(--text)]">
                  Toolpika
                </span>
              </Link>
              <button
                type="button"
                onClick={() => setMenuOpen(false)}
                className="rounded-[var(--radius-md)] p-2 text-[var(--muted)] hover:bg-[var(--surface-2)] hover:text-[var(--text)] transition-colors duration-[var(--dur-fast)]"
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
                      "flex items-center gap-3 px-3 py-2.5 rounded-[var(--radius-md)] text-sm font-medium transition-[background-color,color] duration-[var(--dur-fast)] ease-[var(--ease-out)]",
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
                    className={cn(
                      "flex w-full items-center gap-3 px-3 py-2 rounded-[var(--radius-md)] text-sm font-medium text-[var(--text)] transition-[background-color,color] duration-[var(--dur-fast)] ease-[var(--ease-out)] hover:bg-[var(--surface-2)] hover:text-[var(--accent)]",
                    )}
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
