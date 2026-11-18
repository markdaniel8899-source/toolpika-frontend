"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowRight, Check, ChevronDown, Globe, Menu, Moon, Sun, X, Zap } from "lucide-react";
import { usePathname, useRouter, Link } from "@/i18n/navigation";
import { useLocale, useTranslations } from "next-intl";
import type { Locale } from "@/i18n/routing";
import { cn } from "@/lib/utils";
import { useScrolled } from "@/hooks/useScrolled";

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
  const tTools = useTranslations("tools");
  const tFooter = useTranslations("footer");
  const l = useTranslations("language");
  const th = useTranslations("theme");
  const pathname = usePathname();
  const router = useRouter();
  const locale = useLocale();
  const scrolled = useScrolled(8);

  const [menuOpen, setMenuOpen] = useState(false);
  const [localeOpen, setLocaleOpen] = useState(false);
  const [localeHighlight, setLocaleHighlight] = useState(0);
  const localeRef = useRef<HTMLDivElement>(null);
  const localeButtonRef = useRef<HTMLButtonElement>(null);

  const [theme, setTheme] = useState<"light" | "dark">(() => {
    if (typeof document === "undefined") return "light";
    return document.documentElement.getAttribute("data-theme") === "dark" ? "dark" : "light";
  });

  useEffect(() => {
    document.body.classList.toggle("menu-open", menuOpen);
    return () => document.body.classList.remove("menu-open");
  }, [menuOpen]);

  useEffect(() => {
    if (!localeOpen) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!localeRef.current?.contains(event.target as Node)) {
        setLocaleOpen(false);
      }
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [localeOpen]);

  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    const root = document.documentElement;
    root.classList.add("theme-transition");
    setTheme(next);
    root.setAttribute("data-theme", next);
    try {
      localStorage.setItem("theme", next);
    } catch {
      // Storage can be blocked; the attribute still updates for this session.
    }
    window.setTimeout(() => root.classList.remove("theme-transition"), 320);
  };

  const changeLocale = (next: Locale) => {
    setMenuOpen(false);
    setLocaleOpen(false);
    if (next === locale) return;
    router.replace(pathname, { locale: next });
    router.refresh();
  };

  const openLocaleMenu = () => {
    const currentIndex = LOCALES.findIndex((item) => item.code === locale);
    setLocaleHighlight(currentIndex >= 0 ? currentIndex : 0);
    setLocaleOpen(true);
  };

  const onLocaleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "Escape") {
      setLocaleOpen(false);
      localeButtonRef.current?.focus();
      return;
    }
    if (event.key === "ArrowDown") {
      event.preventDefault();
      if (!localeOpen) {
        openLocaleMenu();
      } else {
        setLocaleHighlight((index) => (index + 1) % LOCALES.length);
      }
      return;
    }
    if (event.key === "ArrowUp") {
      event.preventDefault();
      if (!localeOpen) {
        openLocaleMenu();
      } else {
        setLocaleHighlight((index) => (index - 1 + LOCALES.length) % LOCALES.length);
      }
      return;
    }
    if (event.key === "Enter" && localeOpen) {
      event.preventDefault();
      changeLocale(LOCALES[localeHighlight].code);
    }
  };

  const navItems = [
    { href: "/", label: tTools("home") },
    { href: "/all-tools", label: t("tools") },
    { href: "/guides", label: t("guides") },
    { href: "/about", label: tFooter("about") },
  ];

  return (
    <header className={cn("tp-header", scrolled && "shadow-[var(--shadow-sm)]")}>
      <div className="tp-container tp-header-inner">
        <Link href="/" className="tp-brand" aria-label="Toolpika">
          <Zap className="tp-brand-mark" aria-hidden="true" />
          Toolpika
        </Link>

        <nav className="tp-nav" aria-label="Main">
          {navItems.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="tp-header-actions">
          <div className="tp-locale" ref={localeRef}>
            <button
              ref={localeButtonRef}
              type="button"
              className="tp-icon-btn tp-locale-trigger"
              aria-haspopup="listbox"
              aria-expanded={localeOpen}
              aria-label={l("label")}
              onClick={() => (localeOpen ? setLocaleOpen(false) : openLocaleMenu())}
              onKeyDown={onLocaleKeyDown}
            >
              <Globe className="tp-icon" aria-hidden="true" />
              <span>{locale.toUpperCase()}</span>
              <ChevronDown
                className={cn("tp-icon chevron", localeOpen && "is-open")}
                aria-hidden="true"
                style={{ width: 12, height: 12 }}
              />
            </button>

            {localeOpen && (
              <div
                className="tp-locale-menu"
                role="listbox"
                aria-label={l("label")}
                aria-activedescendant={`tp-locale-${LOCALES[localeHighlight].code}`}
                onKeyDown={onLocaleKeyDown}
              >
                {LOCALES.map((item, index) => (
                  <button
                    key={item.code}
                    id={`tp-locale-${item.code}`}
                    type="button"
                    role="option"
                    aria-selected={item.code === locale}
                    className={cn(
                      "tp-locale-option",
                      index === localeHighlight && "is-highlighted",
                      item.code === locale && "is-selected",
                    )}
                    onMouseEnter={() => setLocaleHighlight(index)}
                    onClick={() => changeLocale(item.code)}
                  >
                    <span>{item.label}</span>
                    {item.code === locale && <Check className="tp-icon" style={{ width: 14, height: 14 }} aria-hidden="true" />}
                  </button>
                ))}
              </div>
            )}
          </div>

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
          {navItems.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMenuOpen(false)}
                aria-current={active ? "page" : undefined}
                className="justify-between"
              >
                {item.label}
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
