import * as React from "react";

import { cn } from "@/lib/utils";

/**
 * Section 7 — Breadcrumbs.
 * Home > Category > Tool Name, 14px, muted; current page in --text.
 */
export function Breadcrumbs({
  items,
  className,
}: {
  items: { label: string; href?: string }[];
  className?: string;
}) {
  return (
    <nav
      aria-label="Breadcrumb"
      className={cn("flex flex-wrap gap-1 text-[14px] text-[var(--muted)]", className)}
    >
      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        return (
          <React.Fragment key={item.label}>
            {item.href ? (
              <a
                href={item.href}
                className={cn(
                  "transition-colors duration-[var(--dur-fast)] ease-[var(--ease-out)] hover:text-[var(--accent)]",
                  isLast ? "" : ""
                )}
              >
                {item.label}
              </a>
            ) : (
              <span className="text-[var(--text)]">{item.label}</span>
            )}
            {!isLast && <span className="mx-1">›</span>}
          </React.Fragment>
        );
      })}
    </nav>
  );
}
