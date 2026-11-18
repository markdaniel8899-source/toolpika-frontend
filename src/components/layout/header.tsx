"use client";

import { useEffect, useState } from "react";
import { ArrowRight, ChevronDown, Globe, Menu, Moon, Sun, X, Zap } from "lucide-react";
import { usePathname, useRouter, Link } from "@/i18n/navigation";
import { useLocale, useTranslations } from "next-intl";
import type { Locale } from "@/i18n/routing";
import { cn } from "@/lib/utils";
import { useScrolled } from "@/hooks/useScrolled";

const NAV = [
  { href: "/", key: "tools" },
  { href: "/popular", key: "popular" },
  { href: "/new", key: "new" },
  { href: "/guides", key: "guides" },
] as const;

const LOCALES: { code: Locale; label: string }[] = [
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
];

export function Header() {
  const t = useTranslations("nav");
  const l = useTranslations("language");
  const th = useTranslations("theme");
  const pathname = usePathname();
  const router = useRouter();
  const locale = useLocale();
  const scrolled = useScrolled(8);

  const [menuOpen, setMenuOpen] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    if (typeof document === "undefined") return "light";
    return document.documentElement.getAttribute("data-theme") === "dark" ? "dark" : "light";
  });

  useEffect(() => {
    document.body.classList.toggle("menu-open", menuOpen);
    return () => document.body.classList.remove("menu-open");
  }, [menuOpen]);

  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    document.documentElement.setAttribute("data-theme", next);
    try {
      localStorage.setItem("theme", next);
    } catch {
      // Storage can be blocked; the attribute still updates for this session.
    }
  };

  const changeLocale = (next: Locale) => {
    setMenuOpen(false);
    if (next === locale) return;
    router.replace(pathname, { locale: next });
    router.refresh();
  };

  return (
    <header className={cn("tp-header", scrolled && "shadow-[var(--shadow-sm)]")}>
      <div className="tp-container tp-header-inner">
        <Link href="/" className="tp-brand" aria-label="Toolpika">
          <Zap className="tp-brand-mark" aria-hidden="true" />
          Toolpika
        </Link>

        <nav className="tp-nav" aria-label="Main">
          {NAV.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
              >
                {t(item.key)}
              </Link>
            );
          })}
        </nav>

        <div className="tp-header-actions">
          <label className="tp-icon-btn" aria-label={l("label")}>
            <Globe className="tp-icon" aria-hidden="true" />
            <select
              value={locale}
              onChange={(event) => changeLocale(event.target.value as Locale)}
              className="w-[54px] appearance-none border-0 bg-transparent outline-none"
              aria-label={l("label")}
            >
              {LOCALES.map((item) => (
                <option key={item.code} value={item.code}>
                  {item.code.toUpperCase()}
                </option>
              ))}
            </select>
            <ChevronDown className="tp-icon" aria-hidden="true" style={{ width: 12, height: 12 }} />
          </label>

          <button
            type="button"
            onClick={toggleTheme}
            aria-label={th("toggle")}
            className="tp-icon-btn tp-icon-only"
          >
            {theme === "dark" ? (
              <Sun className="tp-icon" aria-hidden="true" />
            ) : (
              <Moon className="tp-icon" aria-hidden="true" />
            )}
          </button>

          <Link href="/request" className="tp-btn tp-btn-primary tp-header-cta">
            <ArrowRight className="tp-icon" aria-hidden="true" />
            {t("request")}
          </Link>

          <button
            type="button"
            onClick={() => setMenuOpen((prev) => !prev)}
            className="tp-icon-btn tp-icon-only tp-mobile-toggle"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
          >
            {menuOpen ? <X className="tp-icon" aria-hidden="true" /> : <Menu className="tp-icon" aria-hidden="true" />}
          </button>
        </div>
      </div>

      <div className="tp-mobile-panel" aria-label="Mobile menu">
        <nav aria-label="Mobile main">
          {NAV.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMenuOpen(false)}
                aria-current={active ? "page" : undefined}
                className="justify-between"
              >
                {t(item.key)}
                <ArrowRight className="tp-icon" aria-hidden="true" />
              </Link>
            );
          })}
          <Link href="/request" onClick={() => setMenuOpen(false)}>
            {t("request")}
            <ArrowRight className="tp-icon" aria-hidden="true" />
          </Link>
        </nav>

        <div style={{ marginTop: 24 }}>
          <p className="tp-micro" style={{ marginBottom: 10 }}>{l("label")}</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 8 }}>
            {LOCALES.map((item) => (
              <button
                key={item.code}
                type="button"
                onClick={() => changeLocale(item.code)}
                className="tp-icon-btn"
                style={{ justifyContent: "flex-start" }}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </header>
  );
}
