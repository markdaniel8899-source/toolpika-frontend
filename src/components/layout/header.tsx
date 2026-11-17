"use client";

import { useState } from "react";
import { Plus, Search, Globe, Menu, X } from "lucide-react";
import { usePathname } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useScrolled } from "@/hooks/useScrolled";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/theme-toggle";

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
  const s = useTranslations("search");
  const pathname = usePathname();
  const scrolled = useScrolled(8);
  const [menuOpen, setMenuOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const [locale, setLocale] = useState<string>(() => {
    if (typeof document === "undefined") return "en";
    return document.documentElement.lang || "en";
  });

  return (
    <header
      className={cn(
        "sticky top-0 z-40 h-[64px] border-b border-[var(--border)] bg-[var(--surface)]/90 backdrop-blur-[14px]",
        "transition-[border-color,box-shadow,background-color] duration-[var(--dur-base)] ease-[var(--ease-out)]",
        scrolled && "shadow-[var(--shadow-md)] border-[var(--accent)]",
      )}
    >
      <div className="mx-auto flex h-full w-full max-w-page items-center justify-between gap-2 px-4 sm:px-6">
        {/* Left: Logo */}
        <Link href="/" className="flex shrink-0 items-center gap-2.5" aria-label="Toolpika">
          <span className="flex h-8 w-8 items-center justify-center rounded-[var(--radius-md)] bg-[var(--accent-fill)] text-[var(--accent-fg)] font-heading font-bold text-[20px] leading-none tracking-tight">
            T
          </span>
          <span className="font-heading text-[18px] font-bold tracking-[-0.01em] text-[var(--text)] sm:text-[20px]">
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
                  "relative px-3 py-2 transition-colors duration-[var(--dur-fast)] ease-[var(--ease-out)]",
                  active
                    ? "text-[var(--text)]"
                    : "hover:text-[var(--text)]",
                )}
              >
                {t(item.key)}
                {active && (
                  <span className="absolute -bottom-[2px] left-0 right-0 h-[2px] bg-[var(--accent)] rounded-full" aria-hidden="true" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Right: actions */}
        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          {/* Search icon button */}
          <button
            type="button"
            className={cn(
              "inline-flex h-9 w-9 items-center justify-center rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] text-[var(--muted)]",
              "transition-[background-color,color,border-color] duration-[var(--dur-fast)] ease-[var(--ease-out)]",
              "hover:bg-[var(--surface-2)] hover:text-[var(--text)] hover:border-[var(--accent)]",
              "focus-visible:outline-2 focus-visible:outline-[var(--ring)] focus-visible:outline-offset-3",
              "sm:hidden",
            )}
            aria-label={s("placeholder")}
          >
            <Search className="h-5 w-5" aria-hidden="true" />
          </button>

          <ThemeToggle />

          {/* Language selector (custom, not native <select>) */}
          <LanguageTrigger
            locale={locale}
            langOpen={langOpen}
            setLangOpen={setLangOpen}
            setLocale={setLocale}
          />

          {/* Request a tool button (desktop only) */}
          <Link
            href="/request"
            className={cn(
              "hidden sm:inline-flex items-center justify-center rounded-[var(--radius-md)] bg-[var(--accent-fill)] px-5 py-2.5 font-semibold text-[var(--accent-fg)] text-sm",
              "transition-all duration-[var(--dur-fast)] ease-[var(--ease-out)]",
              "hover:bg-[var(--accent-fill-hover)] hover:scale-[1.02]",
              "focus-visible:outline-2 focus-visible:outline-[var(--ring)] focus-visible:outline-offset-3",
            )}
          >
            <Plus className="h-4 w-4 mr-1.5" aria-hidden="true" />
            {t("request")}
          </Link>

          {/* Mobile menu button */}
          <button
            type="button"
            onClick={() => setMenuOpen((prev) => !prev)}
            className={cn(
              "inline-flex h-9 w-9 items-center justify-center rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] text-[var(--muted)]",
              "transition-[background-color,color,border-color] duration-[var(--dur-fast)] ease-[var(--ease-out)]",
              "hover:bg-[var(--surface-2)] hover:text-[var(--text)]",
              "focus-visible:outline-2 focus-visible:outline-[var(--ring)] focus-visible:outline-offset-3",
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
              "transform transition-[transform] duration-250 ease-[var(--ease-out)]",
              menuOpen ? "translate-x-0" : "-translate-x-full",
            )}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border)]">
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
                      "flex items-center gap-3 px-3 py-2.5 rounded-[var(--radius-md)] text-sm font-medium transition-colors duration-[var(--dur-fast)]",
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
                    className="flex w-full items-center gap-3 px-3 py-2 rounded-[var(--radius-md)] text-sm font-medium text-[var(--text)] hover:bg-[var(--surface-2)] hover:text-[var(--accent)] transition-colors duration-[var(--dur-fast)]"
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

interface LanguageTriggerProps {
  locale: string;
  langOpen: boolean;
  setLangOpen: (open: boolean | ((prev: boolean) => boolean)) => void;
  setLocale: (code: string) => void;
}

function LanguageTrigger({
  locale,
  langOpen,
  setLangOpen,
  setLocale,
}: LanguageTriggerProps) {
  const l = useTranslations("language");

  return (
    <>
      <button
        type="button"
        onClick={() => setLangOpen((prev) => !prev)}
        className={cn(
          "inline-flex h-9 w-9 items-center justify-center rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] text-[var(--muted)]",
          "transition-[background-color,color,border-color] duration-[var(--dur-fast)] ease-[var(--ease-out)]",
          "hover:bg-[var(--surface-2)] hover:text-[var(--text)]",
          "focus-visible:outline-2 focus-visible:outline-[var(--ring)] focus-visible:outline-offset-3",
          "sm:hidden",
        )}
        aria-label={l("label")}
        aria-expanded={langOpen}
        aria-haspopup="listbox"
      >
        <Globe className="h-5 w-5" aria-hidden="true" />
      </button>

      <button
        type="button"
        onClick={() => setLangOpen((prev) => !prev)}
        className={cn(
          "inline-flex h-9 w-9 items-center justify-center rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] text-[var(--muted)]",
          "transition-[background-color,color,border-color] duration-[var(--dur-fast)] ease-[var(--ease-out)]",
          "hover:bg-[var(--surface-2)] hover:text-[var(--text)]",
          "focus-visible:outline-2 focus-visible:outline-[var(--ring)] focus-visible:outline-offset-3",
          "hidden sm:flex",
        )}
        aria-label={l("label")}
        aria-expanded={langOpen}
        aria-haspopup="listbox"
      >
        <Globe className="h-5 w-5" aria-hidden="true" />
        <span className="ml-1.5 font-medium text-[14px] text-[var(--text)] uppercase tracking-[0.05em]">
          {locale.toUpperCase()}
        </span>
      </button>

      {langOpen && (
        <div className="absolute right-0 mt-2 w-48 rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow-md)] py-2 z-50">
          {LOCALES.map((item) => (
            <button
              key={item.code}
              onClick={() => {
                setLocale(item.code);
                setLangOpen(false);
              }}
              className="flex w-full items-center gap-2 px-3 py-2 text-[14px] text-[var(--text)] hover:bg-[var(--surface-2)] hover:text-[var(--accent)] transition-colors duration-[var(--dur-fast)]"
            >
              <span className="font-medium">{item.label}</span>
            </button>
          ))}
        </div>
      )}
    </>
  );
}
