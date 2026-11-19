"use client";

import { useEffect, useLayoutEffect, useRef } from "react";
import { usePathname } from "@/i18n/navigation";

const useIsomorphicLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

function prefersReducedMotion() {
  return typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function SiteMotion() {
  const pathname = usePathname();
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);

  /* Restore the chosen theme before paint on every locale navigation. */
  useIsomorphicLayoutEffect(() => {
    try {
      const saved = localStorage.getItem("theme");
      if (saved === "dark" || saved === "light") {
        document.documentElement.setAttribute("data-theme", saved);
      }
    } catch {
      // Storage may be blocked; the current attribute stays untouched.
    }
  }, [pathname]);

  /* Custom cursor */
  useEffect(() => {
    if (prefersReducedMotion()) return;
    const dot = dotRef.current;
    const ring = ringRef.current;
    if (!dot || !ring) return;

    let targetX = -100;
    let targetY = -100;
    let ringX = -100;
    let ringY = -100;
    let frame = 0;

    const onMove = (event: PointerEvent) => {
      targetX = event.clientX;
      targetY = event.clientY;
      dot.style.opacity = "1";
      ring.style.opacity = "1";
    };

    const onOver = (event: PointerEvent) => {
      const el = event.target as HTMLElement | null;
      const interactive = el?.closest("a, button, [role='button'], input, textarea, select");
      if (interactive) ring.classList.add("is-active");
    };

    const onOut = (event: PointerEvent) => {
      const el = event.target as HTMLElement | null;
      const interactive = el?.closest("a, button, [role='button'], input, textarea, select");
      if (interactive && !el?.closest(":hover")) ring.classList.remove("is-active");
    };

    const tick = () => {
      ringX += (targetX - ringX) * 0.18;
      ringY += (targetY - ringY) * 0.18;
      dot.style.transform = `translate3d(${targetX}px, ${targetY}px, 0)`;
      ring.style.transform = `translate3d(${ringX}px, ${ringY}px, 0)`;
      frame = window.requestAnimationFrame(tick);
    };

    document.addEventListener("pointermove", onMove);
    document.addEventListener("pointerover", onOver);
    document.addEventListener("pointerout", onOut);
    frame = window.requestAnimationFrame(tick);

    return () => {
      document.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerover", onOver);
      document.removeEventListener("pointerout", onOut);
      window.cancelAnimationFrame(frame);
    };
  }, []);

  /* Magnetic buttons — small pointer-driven offset, spring return via CSS. */
  useEffect(() => {
    if (prefersReducedMotion() || !window.matchMedia("(pointer: fine)").matches) return;

    let active: HTMLElement | null = null;
    const reset = (el: HTMLElement | null) => {
      if (el) el.style.transform = "";
    };

    const onMove = (event: PointerEvent) => {
      const found = (event.target as HTMLElement | null)?.closest<HTMLElement>(".tp-btn") ?? null;
      // Static CTAs keep their CSS hover transform; magnetic inline transforms
      // would otherwise override it and make them look unresponsive.
      const el = found?.classList.contains("tp-static-cta") ? null : found;
      if (el !== active) {
        reset(active);
        active = el;
      }
      if (!active) return;
      const r = active.getBoundingClientRect();
      const dx = (event.clientX - r.left - r.width / 2) * 0.12;
      const dy = (event.clientY - r.top - r.height / 2) * 0.16;
      active.style.transform = `translate3d(${dx}px, ${dy}px, 0)`;
    };

    const onOut = (event: PointerEvent) => {
      const el = (event.target as HTMLElement | null)?.closest<HTMLElement>(".tp-btn") ?? null;
      const next = event.relatedTarget as Node | null;
      if (el && (!next || !el.contains(next))) {
        reset(el);
        if (active === el) active = null;
      }
    };

    document.addEventListener("pointermove", onMove);
    document.addEventListener("pointerout", onOut);
    return () => {
      document.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerout", onOut);
      reset(active);
    };
  }, []);

  return (
    <>
      <div ref={dotRef} className="tp-cursor-dot" aria-hidden="true" />
      <div ref={ringRef} className="tp-cursor-ring" aria-hidden="true" />
    </>
  );
}
