"use client";

import { useEffect, useState, useRef, useCallback } from "react";

/**
 * Section 5 — Scroll reveal.
 * IntersectionObserver, once: true, threshold 0.15.
 * Returns [ref, inView].
 */
export function useInView({
  once = true,
  threshold = 0.15,
  rootMargin = "0px",
}: {
  once?: boolean;
  threshold?: number;
  rootMargin?: string;
} = {}) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);

  const handle = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const [entry] = entries;
      if (entry?.isIntersecting) {
        setInView(true);
      } else if (!once) {
        setInView(false);
      }
    },
    [once]
  );

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const observer = new IntersectionObserver(handle, {
      threshold,
      rootMargin,
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, [ref, handle, threshold, rootMargin]);

  return { ref, inView };
}
