"use client";

import { Moon, Sun } from "lucide-react";
import { useTranslations } from "next-intl";

export function ThemeToggle() {
  const t = useTranslations("theme");

  function toggleTheme() {
    const root = document.documentElement;
    const next =
      root.getAttribute("data-theme") === "dark" ? "light" : "dark";

    root.setAttribute("data-theme", next);

    try {
      localStorage.setItem("theme", next);
    } catch {
      // Storage can be blocked; the attribute still updates for this session.
    }
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={t("toggle")}
      title={t("toggle")}
      className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--surface)] text-[var(--muted)] transition-[color,border-color] duration-[var(--dur-fast)] ease-[var(--ease-out)] hover:text-[var(--text)] hover:border-[var(--accent)] focus-visible:outline-2 focus-visible:outline-[var(--accent)] focus-visible:outline-offset-3 sm:h-10 sm:w-10"
    >
      <Sun className="theme-icon-sun h-[18px] w-[18px]" aria-hidden="true" />
      <Moon className="theme-icon-moon h-[18px] w-[18px]" aria-hidden="true" />
    </button>
  );
}
