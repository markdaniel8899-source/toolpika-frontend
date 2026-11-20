"use client";

import { useEffect, useState } from "react";

/**
 * Skeleton that only appears if the route is genuinely slow.
 *
 * Next.js mounts a route's loading.tsx immediately on navigation. Returning
 * nothing for the first 700ms keeps fast tab switches instant; the timer is
 * cleared if the real page arrives first, so no skeleton is ever painted.
 */
export function DelayedAdminSkeleton({ delay = 700 }: { delay?: number }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setVisible(true), delay);
    return () => window.clearTimeout(timer);
  }, [delay]);

  if (!visible) return null;

  return (
    <div className="tp-admin-page" aria-busy="true" aria-label="Loading">
      <div className="mb-7 flex flex-col gap-3">
        <div className="tp-skeleton tp-skeleton-line h-8 w-64" />
        <div className="tp-skeleton tp-skeleton-line w-80" />
      </div>

      <div className="mb-7 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[0, 1, 2, 3].map((key) => (
          <div key={key} className="tp-admin-card flex flex-col gap-3 p-5">
            <div className="tp-skeleton tp-skeleton-line w-24" />
            <div className="tp-skeleton tp-skeleton-line h-7 w-16" />
          </div>
        ))}
      </div>

      <div className="tp-admin-card flex min-h-[280px] flex-col gap-4 p-6">
        <div className="tp-skeleton tp-skeleton-line w-40" />
        <div className="tp-skeleton tp-skeleton-line w-full" />
        <div className="tp-skeleton tp-skeleton-line w-11/12" />
        <div className="tp-skeleton tp-skeleton-line w-4/5" />
        <div className="tp-skeleton tp-skeleton-line w-full" />
      </div>
    </div>
  );
}
