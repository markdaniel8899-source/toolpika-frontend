"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowRight, Globe, Heart, Menu, Moon, Sun, Trash2, X, Zap } from "lucide-react";
import { usePathname, useRouter, Link } from "@/i18n/navigation";
import { useLocale, useTranslations } from "next-intl";
import type { Locale } from "@/i18n/routing";
import { cn } from "@/lib/utils";
import { useScrolled } from "@/hooks/useScrolled";
import { Dropdown } from "@/components/ui/dropdown";
import { useWishlist } from "@/hooks/useWishlist";
import { getTool } from "@/lib/tools/registry";

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
  const tWish = useTranslations("wishlist");
  const l = useTranslations("language");
  const th = useTranslations("theme");
  const pathname = usePathname();
  const router = useRouter();
  const locale = useLocale();
  const scrolled = useScrolled(8);

  const [menuOpen, setMenuOpen] = useState(false);
  const [wishOpen, setWishOpen] = useState(false);
  const wishRef = useRef<HTMLDivElement>(null);
  const { slugs, remove, count } = useWishlist();

  const [theme, setTheme] = useState<"light" | "dark">(() => {
    if (typeof document === "undefined") return "light";
    return document.documentElement.getAttribute("data-theme") === "dark" ? "dark" : "light";
  });

  useEffect(() => {
    document.body.classList.toggle("menu-open", menuOpen);
    return () => document.body.classList.remove("menu-open");
  }, [menuOpen]);

  useEffect(() => {
    if (!wishOpen) return;
    const onDown = (event: PointerEvent) => {
      if (wishRef.current && !wishRef.current.contains(event.target as Node)) {
        setWishOpen(false);
      }
    };
    document.addEventListener("pointerdown", onDown);
    return () => document.removeEventListener("pointerdown", onDown);
  }, [wishOpen]);

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
    window.setTimeout(() => root.classList.remove("theme-transition"), 240);
  };

  const changeLocale = (next: Locale) => {
    setMenuOpen(false);
    if (next === locale) return;
    router.replace(pathname, { locale: next });
  };

  const navItems = [
    { href: "/", label: tTools("home") },
    { href: "/all-tools", label: t("tools") },
    { href: "/guides", label: t("guides") },
    { href: "/about", label: tFooter("about") },
  ];

  const savedTools = slugs
    .map((slug) => getTool(slug))
    .filter((tool): tool is NonNullable<ReturnType<typeof getTool>> => Boolean(tool));

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
          <Dropdown
            id="site-language"
            value={locale}
            options={LOCALES.map((item) => ({ value: item.code, label: item.label }))}
            onChange={(value) => changeLocale(value as Locale)}
            ariaLabel={l("label")}
            triggerLabel={locale.toUpperCase()}
            icon={<Globe className="tp-icon" aria-hidden="true" />}
            triggerClassName="tp-locale-trigger"
          />

          <div className="tp-wish-wrap" ref={wishRef}>
            <button
              type="button"
              onClick={() => setWishOpen((prev) => !prev)}
              aria-label={tWish("label")}
              aria-expanded={wishOpen}
              className="tp-icon-btn tp-icon-only tp-wish-trigger"
            >
              <Heart className="tp-icon" aria-hidden="true" />
              {count > 0 && <span className="tp-wish-count">{count}</span>}
            </button>

            {wishOpen && (
              <div className="tp-wish-panel">
                <p className="tp-wish-title">{tWish("label")}</p>
                {savedTools.length === 0 ? (
                  <p className="tp-wish-empty">{tWish("empty")}</p>
                ) : (
                  savedTools.map((tool) => (
                    <div className="tp-wish-row" key={tool.slug}>
                      <Link href={`/tools/${tool.slug}`} onClick={() => setWishOpen(false)}>
                        {tool.title}
                      </Link>
                      <button
                        type="button"
                        className="tp-wish-remove"
                        onClick={() => remove(tool.slug)}
                        aria-label={tWish("remove", { title: tool.title })}
                        title={tWish("remove", { title: tool.title })}
                      >
                        <Trash2 className="tp-icon" aria-hidden="true" />
                      </button>
                    </div>
                  ))
                )}
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
