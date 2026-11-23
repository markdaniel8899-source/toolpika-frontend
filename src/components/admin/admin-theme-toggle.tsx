"use client";

import { Moon, Sun } from "lucide-react";
import { setTheme } from "@/lib/theme";

/**
 * Admin theme toggle.
 *
 * The public ThemeToggle depends on next-intl, which the admin area (a second
 * root layout with no locale prefix) does not provide. This standalone toggle
 * uses the same data-theme + localStorage contract as ThemeScript so the two
 * areas stay in sync. The icon is swapped with CSS from the pre-paint theme
 * attribute, keeping server and client markup identical.
 */
export function AdminThemeToggle({ label }: { label: string }) {
  function toggleTheme() {
    const root = document.documentElement;
    const current = root.getAttribute("data-theme") === "dark" ? "dark" : "light";
    setTheme(current === "dark" ? "light" : "dark");
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={label}
      title={label}
      className="tp-admin-icon"
    >
      <Moon className="h-[18px] w-[18px] tp-theme-icon--moon" aria-hidden="true" />
      <Sun className="h-[18px] w-[18px] tp-theme-icon--sun" aria-hidden="true" />
    </button>
  );
}
