"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { useCookieConsent } from "@/hooks/use-cookie-consent";

/**
 * Self-contained, GDPR-style consent banner. It owns its hydration-safe
 * hook, so the root layout (a server component) only has to render <CookieBanner />.
 * Motion uses the project's existing framer-motion dependency — no new library.
 */
export function CookieBanner() {
  const t = useTranslations("cookies");
  const { showBanner, acceptAll, rejectNonEssential } = useCookieConsent();

  return (
    <AnimatePresence>
      {showBanner && (
        <motion.aside
          className="tp-cookie-banner"
          role="dialog"
          aria-label={t("title")}
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 16 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
        >
          <div className="tp-cookie-copy">
            <strong className="tp-cookie-title">{t("title")}</strong>
            <p className="tp-cookie-text">{t("text")}</p>
          </div>
          <div className="tp-cookie-actions">
            <button type="button" className="tp-cookie-accept" onClick={acceptAll}>
              {t("acceptAll")}
            </button>
            <button type="button" className="tp-cookie-reject" onClick={rejectNonEssential}>
              {t("reject")}
            </button>
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
