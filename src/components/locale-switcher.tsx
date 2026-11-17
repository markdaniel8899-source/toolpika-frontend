"use client";

import { useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";

const localeNames: Record<string, string> = {
  en: "English",
  de: "Deutsch",
  fr: "Français",
  es: "Español",
  "pt-BR": "Português (BR)",
  ru: "Русский",
  tr: "Türkçe",
  it: "Italiano",
  ar: "العربية",
  hi: "हिन्दी",
};

export function LocaleSwitcher() {
  const locale = useLocale();
  const t = useTranslations("language");
  const pathname = usePathname();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function switchLocale(nextLocale: string) {
    startTransition(() => {
      router.replace(pathname, { locale: nextLocale });
    });
  }

  return (
    <>
      <label htmlFor="locale-switcher" className="sr-only">
        {t("label")}
      </label>
      <select
        id="locale-switcher"
        value={locale}
        disabled={isPending}
        onChange={(event) => switchLocale(event.target.value)}
        className="h-9 w-[88px] rounded-full border border-[var(--border)] bg-[var(--surface)] px-2 text-[13px] text-[var(--text)] transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-[var(--accent)] focus-visible:outline-offset-3 disabled:opacity-60 sm:h-10 sm:w-auto sm:px-3 sm:text-sm"
      >
        {routing.locales.map((item) => (
          <option key={item} value={item}>
            {localeNames[item] ?? item}
          </option>
        ))}
      </select>
    </>
  );
}
