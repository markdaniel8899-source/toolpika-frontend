"use client";

import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "toolpika_wishlist";
const CHANGE_EVENT = "toolpika:wishlist-change";

/** Read from localStorage only on the client (never during SSR/first render). */
function readWishlist(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed)
      ? parsed.filter((slug): slug is string => typeof slug === "string")
      : [];
  } catch {
    return [];
  }
}

export function useWishlist() {
  // Server render and first client render are identical: empty + not loaded.
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  /* eslint-disable react-hooks/set-state-in-effect -- localStorage must be read after mount so SSR and the first client render match (no hydration mismatch). */
  useEffect(() => {
    setWishlist(readWishlist());
    setIsLoaded(true);

    const sync = () => setWishlist(readWishlist());
    window.addEventListener(CHANGE_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(CHANGE_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  const persist = useCallback((next: string[]) => {
    setWishlist(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // Storage can be blocked; the in-memory state still works this session.
    }
    window.dispatchEvent(new CustomEvent(CHANGE_EVENT));
  }, []);

  const toggleWishlist = useCallback(
    (slug: string) => {
      const next = wishlist.includes(slug)
        ? wishlist.filter((item) => item !== slug)
        : [...wishlist, slug];
      persist(next);
    },
    [wishlist, persist]
  );

  const isInWishlist = useCallback((slug: string) => wishlist.includes(slug), [wishlist]);

  return {
    wishlist,
    toggleWishlist,
    isInWishlist,
    count: wishlist.length,
    isLoaded,
  };
}
