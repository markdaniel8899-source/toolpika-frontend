"use client";

import { useState } from "react";
import { Moon, Sun } from "lucide-react";

/**
 * Admin theme toggle.
 *
 * The public ThemeToggle depends on next-intl, which the admin area (a second
 * root layout with no locale prefix) does not provide. This standalone toggle
 * uses the same data-theme + localStorage contract as ThemeScript so the two
 * areas stay in sync.
 */
export function AdminThemeToggle({ label }: { label: string }) {
  // Read the theme applied by ThemeScript on first render. Hydration matches
  // because data-theme is set in the blocking head script before paint.
  const [theme, setTheme] = useState<"light" | "dark">(() =>
    typeof document !== "undefined" &&
    document.documentElement.getAttribute("data-theme") === "dark"
      ? "dark"
      : "light",
  );

  function toggleTheme() {
    const root = document.documentElement;
    const next = root.getAttribute("data-theme") === "dark" ? "light" : "dark";

    root.setAttribute("data-theme", next);
    setTheme(next);

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
      aria-label={label}
      title={label}
      className="inline-flex h-9 w-9 items-center justify-center rounded-[10px] border border-[var(--border)] bg-[var(--surface)] text-[var(--muted)] transition-colors duration-200 hover:border-[var(--accent)] hover:text-[var(--text)] focus-visible:outline-2 focus-visible:outline-[var(--accent)] focus-visible:outline-offset-3"
    >
      {theme === "dark" ? (
        <Sun className="h-[18px] w-[18px]" aria-hidden="true" />
      ) : (
        <Moon className="h-[18px] w-[18px]" aria-hidden="true" />
      )}
    </button>
  );
}
