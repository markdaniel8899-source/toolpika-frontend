import * as React from "react";

import { cn } from "@/lib/utils";

/**
 * Section 7 - Chips.
 * Pill shape, 1px --border, --surface background, 14px text.
 * Hover: --accent-soft background, --accent text.
 */
export function Chip({
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      {...props}
      className={cn(
        "inline-flex items-center rounded-full border border-[var(--border)] bg-[var(--surface)] px-3 py-1 text-[14px] font-medium text-[var(--text)] transition-[background-color,color,border-color] duration-[var(--dur-fast)] ease-[var(--ease-out)] hover:bg-[var(--accent-soft)] hover:text-[var(--accent)] hover:border-[var(--accent)]",
        className
      )}
    />
  );
}
