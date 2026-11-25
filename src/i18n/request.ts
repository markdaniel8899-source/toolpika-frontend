import * as rootParams from "next/root-params";
import { notFound } from "next/navigation";
import { hasLocale } from "next-intl";
import { getRequestConfig } from "next-intl/server";
import { routing } from "./routing";

type Messages = Record<string, unknown>;

/**
 * Deep-merge a locale's messages over English so newly authored English keys
 * render as a safe fallback until the translation step fills the locale file.
 * Existing translated values always win.
 */
function mergeMessages(base: Messages, override: Messages): Messages {
  const result: Messages = { ...base };
  for (const [key, value] of Object.entries(override)) {
    const baseValue = result[key];
    if (
      value &&
      typeof value === "object" &&
      !Array.isArray(value) &&
      baseValue &&
      typeof baseValue === "object" &&
      !Array.isArray(baseValue)
    ) {
      result[key] = mergeMessages(baseValue as Messages, value as Messages);
    } else {
      result[key] = value;
    }
  }
  return result;
}

export default getRequestConfig(async ({ locale }) => {
  if (!locale) {
    const paramValue = await rootParams.locale();

    if (hasLocale(routing.locales, paramValue)) {
      locale = paramValue;
    } else {
      notFound();
    }
  }

  const enMessages = (await import("../../messages/en.json")).default as Messages;
  const localeMessages = (
    await import(`../../messages/${locale}.json`)
  ).default as Messages;

  return {
    locale,
    messages: mergeMessages(enMessages, localeMessages),
  };
});
