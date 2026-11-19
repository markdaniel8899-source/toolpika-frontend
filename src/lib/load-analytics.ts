import type { CookieConsent } from "@/hooks/use-cookie-consent";

/**
 * Future-proof gate for analytics scripts.
 *
 * Call this from the client only, after consent has been loaded from
 * localStorage. Nothing is injected unless the visitor opted in.
 */
export function loadAnalytics(consent: CookieConsent | null): void {
  if (!consent?.analytics) return;

  // TODO: inject the chosen analytics provider's script here.
  // Example: create a <script> element with the provider URL and append it
  // to document.head once, guarded by a module-level "loaded" flag.
}
