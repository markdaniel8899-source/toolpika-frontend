"use client";

import { useEffect } from "react";

const RECENT_KEY = "tp-recent-tools";

/** Records a tool visit so the home page can show a small "recent" row. */
export function TrackToolView({ slug }: { slug: string }) {
  useEffect(() => {
    try {
      const parsed = JSON.parse(localStorage.getItem(RECENT_KEY) ?? "[]") as string[];
      const next = [slug, ...parsed.filter((item) => item !== slug)].slice(0, 6);
      localStorage.setItem(RECENT_KEY, JSON.stringify(next));
    } catch {
      // Storage may be blocked; tracking is optional.
    }
  }, [slug]);

  return null;
}
