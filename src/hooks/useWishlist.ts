"use client";

import { useCallback, useSyncExternalStore } from "react";

const STORAGE_KEY = "toolpika:wishlist";
const CHANGE_EVENT = "toolpika:wishlist-change";
const EMPTY: string[] = [];

let snapshot: string[] | null = null;

function read(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return snapshot ?? [];
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === "string") : [];
  } catch {
    return snapshot ?? [];
  }
}

function getSnapshot(): string[] {
  if (snapshot === null) snapshot = read();
  return snapshot;
}

function subscribe(onChange: () => void) {
  const sync = () => {
    snapshot = read();
    onChange();
  };
  window.addEventListener(CHANGE_EVENT, sync);
  window.addEventListener("storage", sync);
  return () => {
    window.removeEventListener(CHANGE_EVENT, sync);
    window.removeEventListener("storage", sync);
  };
}

function write(slugs: string[]) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(slugs));
  } catch {
    // Storage can be blocked; keep the in-memory state for this session.
  }
  snapshot = slugs;
  window.dispatchEvent(new CustomEvent(CHANGE_EVENT));
}

/** Idempotent add — used when a tool card itself is clicked. */
export function addToWishlist(slug: string) {
  const current = read();
  if (current.includes(slug)) return;
  write([...current, slug]);
}

export function removeFromWishlist(slug: string) {
  const current = read();
  if (!current.includes(slug)) return;
  write(current.filter((item) => item !== slug));
}

export function toggleWishlist(slug: string) {
  const current = read();
  write(current.includes(slug) ? current.filter((item) => item !== slug) : [...current, slug]);
}

export function useWishlist() {
  const slugs = useSyncExternalStore(subscribe, getSnapshot, () => EMPTY);

  const has = useCallback((slug: string) => slugs.includes(slug), [slugs]);
  const toggle = useCallback((slug: string) => toggleWishlist(slug), []);
  const remove = useCallback((slug: string) => removeFromWishlist(slug), []);

  return { slugs, has, toggle, remove, count: slugs.length };
}
