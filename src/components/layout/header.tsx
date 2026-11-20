"use client";

import { useEffect, useRef, useState, type ComponentType, type SVGProps } from "react";
import { ArrowRight, ArrowUpRight, Globe, Heart, LayoutGrid, Menu, Moon, Sun, Trash2, X, Zap } from "lucide-react";
import { usePathname, useRouter, Link } from "@/i18n/navigation";
import { useLocale, useTranslations } from "next-intl";
import type { Locale } from "@/i18n/routing";
import { cn } from "@/lib/utils";
import { useScrolled } from "@/hooks/useScrolled";
import { Dropdown } from "@/components/ui/dropdown";
import { PillCta } from "@/components/ui/pill-cta";
import { ToolIcon } from "@/components/tools/tool-icon";
import { useWishlist } from "@/hooks/use-wishlist";
import { categories, getLiveTools, getPopularTools, getTool } from "@/lib/tools/registry";

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
  const [toolsMenuOpen, setToolsMenuOpen] = useState(false);
  const menuTimer = useRef<number | null>(null);
  const wishRef = useRef<HTMLDivElement>(null);

  /* Keep hover menus open while the pointer travels from trigger to panel. */
  const hoverOpen = (set: (value: boolean) => void) => {
    if (menuTimer.current !== null) {
      window.clearTimeout(menuTimer.current);
      menuTimer.current = null;
    }
    set(true);
  };
  const hoverClose = (set: (value: boolean) => void) => {
    if (menuTimer.current !== null) window.clearTimeout(menuTimer.current);
    menuTimer.current = window.setTimeout(() => set(false), 260);
  };
  const { wishlist, count, isLoaded, toggleWishlist } = useWishlist();

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
    const root = document.documentElement;
    const current = root.getAttribute("data-theme") === "dark" ? "dark" : "light";
    const next = current === "dark" ? "light" : "dark";
    root.classList.add("theme-transition");
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

  const savedTools = isLoaded
    ? wishlist
        .map((slug) => getTool(slug))
        .filter((tool): tool is NonNullable<ReturnType<typeof getTool>> => Boolean(tool))
    : [];

  const allTools = getLiveTools();
  const popularTools = getPopularTools(5);
  const toolGroups = categories.map((category) => ({
    slug: category.slug,
    label: category.label,
    Icon: category.Icon,
    tools: allTools.filter((tool) => tool.category === category.slug),
  }));

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
            if (item.href === "/all-tools") {
              return (
                <div
                  key={item.href}
                  className="tp-nav-tools"
                  onMouseEnter={() => hoverOpen(setToolsMenuOpen)}
                  onMouseLeave={() => hoverClose(setToolsMenuOpen)}
                >
                  <Link href={item.href} aria-current={active ? "page" : undefined}>
                    {item.label}
                  </Link>
                  <div
                    className="tp-nav-mega"
                    data-open={toolsMenuOpen ? "true" : "false"}
                    inert={!toolsMenuOpen}
                  >
                    <div className="tp-nav-mega-head">
                      <p className="tp-nav-mega-eyebrow">{t("popular")}</p>
                      <Link href="/all-tools" className="tp-nav-mega-browse" onClick={() => setToolsMenuOpen(false)}>
                        {t("tools")}
                        <ArrowUpRight className="tp-icon" aria-hidden="true" />
                      </Link>
                    </div>

                    <div className="tp-nav-mega-body">
                      <div className="tp-nav-mega-cats">
                        {toolGroups.map((group) => {
                          const Icon = group.Icon as ComponentType<SVGProps<SVGSVGElement>>;
                          return (
                            <Link
                              key={group.slug}
                              href={`/category/${group.slug}`}
                              className="tp-nav-mega-cat"
                              onClick={() => setToolsMenuOpen(false)}
                            >
                              <span className="tp-nav-mega-cat-icon">
                                <Icon className="tp-icon" aria-hidden="true" />
                              </span>
                              <span className="tp-nav-mega-cat-label">{group.label}</span>
                              <span className="tp-nav-mega-cat-count" aria-hidden="true">
                                {group.tools.length}
                              </span>
                            </Link>
                          );
                        })}
                        <Link
                          href="/all-tools"
                          className="tp-nav-mega-cat"
                          onClick={() => setToolsMenuOpen(false)}
                        >
                          <span className="tp-nav-mega-cat-icon">
                            <LayoutGrid className="tp-icon" aria-hidden="true" />
                          </span>
                          <span className="tp-nav-mega-cat-label">{t("tools")}</span>
                          <span className="tp-nav-mega-cat-count" aria-hidden="true">
                            {allTools.length}
                          </span>
                        </Link>
                      </div>

                      <div className="tp-nav-mega-tools">
                        {popularTools.map((tool) => (
                          <Link
                            key={tool.slug}
                            href={`/tools/${tool.slug}`}
                            className="tp-nav-mega-tool"
                            onClick={() => setToolsMenuOpen(false)}
                          >
                            <span className="tp-nav-mega-tool-icon">
                              <ToolIcon name={tool.icon} className="tp-icon" aria-hidden="true" />
                            </span>
                            <span className="tp-nav-mega-tool-copy">
                              <span className="tp-nav-mega-tool-title">{tool.title}</span>
                              <span className="tp-nav-mega-tool-desc">{tool.description}</span>
                            </span>
                            <ArrowUpRight className="tp-nav-mega-tool-arrow tp-icon" aria-hidden="true" />
                          </Link>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              );
            }
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
            openOnHover
          />

          <div
            className="tp-wish-wrap"
            ref={wishRef}
            onMouseEnter={() => hoverOpen(setWishOpen)}
            onMouseLeave={() => hoverClose(setWishOpen)}
          >
            <button
              type="button"
              onClick={() => setWishOpen((prev) => !prev)}
              aria-label={tWish("label")}
              aria-expanded={wishOpen}
              className="tp-icon-btn tp-icon-only tp-wish-trigger"
            >
              <Heart className="tp-icon" aria-hidden="true" />
              {isLoaded && count > 0 && <span className="tp-wish-count">{count}</span>}
            </button>

            {wishOpen && isLoaded && (
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
                        onClick={() => toggleWishlist(tool.slug)}
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
            <Moon className="tp-icon tp-theme-icon--moon" aria-hidden="true" />
            <Sun className="tp-icon tp-theme-icon--sun" aria-hidden="true" />
          </button>

          <PillCta href="/request" className="tp-header-cta">
            {t("request")}
          </PillCta>

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
