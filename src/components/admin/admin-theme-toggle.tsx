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

    // Smooth, token-based theme swap (matches the public header behaviour).
    root.classList.add("theme-transition");
    root.setAttribute("data-theme", next);
    window.setTimeout(() => root.classList.remove("theme-transition"), 240);
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
      className="tp-admin-icon"
    >
      {theme === "dark" ? (
        <Sun className="h-[18px] w-[18px]" aria-hidden="true" />
      ) : (
        <Moon className="h-[18px] w-[18px]" aria-hidden="true" />
      )}
    </button>
  );
}
