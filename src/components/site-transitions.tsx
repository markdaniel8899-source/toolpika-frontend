"use client";

import { useEffect, useLayoutEffect } from "react";
import { usePathname } from "@/i18n/navigation";

const useIsomorphicLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

/**
 * Applies the mockup's blur-up reveal to every text block and card that is
 * NOT already wrapped in <Reveal>. Runs before paint so there is no flash,
 * and re-runs after each route change. Reduced-motion users get no animation.
 */
const SELECTOR = [
  ".tp-card",
  ".tp-section-title",
  ".tp-page-title h1",
  ".tp-page-title p",
  ".tp-lede",
  ".tp-atlas-title",
  ".tp-atlas-lead",
  ".tp-atlas-h2",
  ".tp-trust-card",
  ".tp-wishlist-item",
  ".tp-wishlist-empty",
  ".tp-cta-inner",
  ".tp-breadcrumbs",
  ".tp-tabs",
  ".tp-suggestion",
  ".tp-footer-brand",
].join(",");

export function SiteTransitions() {
  const pathname = usePathname();

  useIsomorphicLayoutEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const nodes = Array.from(document.querySelectorAll<HTMLElement>(SELECTOR)).filter(
      (el) => !el.closest("[data-reveal-wrap]")
    );

    // Hide synchronously before paint — no flash of unstyled content.
    const baseDelay = 120;
    nodes.forEach((el) => {
      const siblings = el.parentElement
        ? Array.from(el.parentElement.children).filter((child) => nodes.includes(child as HTMLElement))
        : [];
      const index = siblings.indexOf(el);
      el.style.setProperty("--tp-delay", `${baseDelay + Math.min(index, 8) * 90}ms`);
      el.classList.add("tp-anim");
    });

    if (!("IntersectionObserver" in window)) {
      nodes.forEach((el) => el.classList.add("tp-revealed"));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("tp-revealed");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.08, rootMargin: "0px 0px -6% 0px" }
    );
    nodes.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, [pathname]);

  return null;
}
