import * as React from "react";

import { cn } from "@/lib/utils";

/**
 * Section 7 - Badge.
 * Small pill, --accent-soft background, --accent text.
 * 12px is allowed only here (uppercase labels), weight 600.
 */
export function Badge({
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      {...props}
      className={cn(
        "inline-flex items-center rounded-full border border-transparent bg-[var(--accent-soft)] px-2 py-0.5 text-[12px] font-semibold uppercase tracking-[0.05em] text-[var(--accent)]",
        className
      )}
    />
  );
}
