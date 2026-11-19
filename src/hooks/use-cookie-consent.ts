"use client";

import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "toolpika_cookie_consent";

export type CookieConsent = {
  necessary: boolean;
  analytics: boolean;
  marketing: boolean;
};

const REJECT_NON_ESSENTIAL: CookieConsent = {
  necessary: true,
  analytics: false,
  marketing: false,
};

export function useCookieConsent() {
  // null = no decision stored yet. Never read localStorage on the server.
  const [consent, setConsent] = useState<CookieConsent | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  /* eslint-disable react-hooks/set-state-in-effect -- localStorage must be read after mount so SSR and the first client render match (no hydration mismatch). */
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<CookieConsent>;
        setConsent({
          necessary: true,
          analytics: parsed.analytics === true,
          marketing: parsed.marketing === true,
        });
      }
    } catch {
      // Corrupt or blocked storage → treat as "no decision yet".
    }
    setIsLoaded(true);
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  const save = useCallback((next: CookieConsent) => {
    setConsent(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // Storage can be blocked; the in-memory state still applies this session.
    }
  }, []);

  const acceptAll = useCallback(
    () => save({ necessary: true, analytics: true, marketing: true }),
    [save]
  );
  const rejectNonEssential = useCallback(() => save(REJECT_NON_ESSENTIAL), [save]);

  // No banner until storage has been read — avoids a server/client mismatch.
  const showBanner = isLoaded && consent === null;

  return { consent, showBanner, acceptAll, rejectNonEssential, isLoaded };
}
